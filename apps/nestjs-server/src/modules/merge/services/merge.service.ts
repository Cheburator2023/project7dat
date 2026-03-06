import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { JsonCommitEntity } from '../../json-data/entities/json-commit.entity';
import { JsonExportService } from '../../json-data/services/json-export.service';
import { JsonImportService } from '../../json-data/services/json-import.service';
import { JsonCommitService } from '../../json-data/services/json-commit.service';
import { SnapshotService } from '../../snapshots/services/snapshot.service';
import { DiffService } from '../../json-data/services/diff.service';
import { JsonStructureValidator } from '../../json-data/services/interfaces/validation.interfaces';
import { JsonExportResponseDto } from '../../json-data/dto';
import { ApplyMergeResponseDto, MergeDiffDto } from '../dto/merge-response.dto';

@Injectable()
export class MergeService {
    private readonly logger = new Logger(MergeService.name);
    private readonly mergeSessions = new Map<string, {
        commitId: string;
        originalJson: JsonExportResponseDto;
        mergedJson: JsonExportResponseDto;
        diff: MergeDiffDto[];
        timestamp: Date;
        hadExistingCycles: boolean;
    }>();

    constructor(
        @InjectRepository(JsonCommitEntity)
        private readonly commitRepository: Repository<JsonCommitEntity>,
        private readonly jsonExportService: JsonExportService,
        private readonly jsonImportService: JsonImportService,
        private readonly jsonCommitService: JsonCommitService,
        private readonly snapshotService: SnapshotService,
        private readonly diffService: DiffService,
        private readonly dataSource: DataSource,
        private readonly structureValidator: JsonStructureValidator,
    ) {}

    /**
     * Применить коммит к текущей модели данных
     * @param commitId - идентификатор пользовательской версии коммита
     * @returns сессия слияния с результатом
     */
    async applyMerge(commitId: string): Promise<ApplyMergeResponseDto> {
        this.logger.log(`Запуск слияния для коммита: ${commitId}`);

        // 1. Получаем коммит
        const commit = await this.jsonCommitService.getCommitById(commitId);
        if (commit.state !== 'processing') {
            throw new BadRequestException(
                `Коммит должен быть в статусе 'processing', текущий статус: ${commit.state}`,
            );
        }
        if (!commit.commit) {
            throw new BadRequestException('Коммит не содержит JSON данных');
        }

        // 2. Получаем текущую модель данных из РБД
        const currentModel = await this.jsonExportService.exportToJson();

        // 3. Проверяем рекурсию в текущей модели
        const recursionCurrent = this.structureValidator.checkForRecursion(
            currentModel.entities,
            currentModel.mappings,
        );
        const hadExistingCycles = recursionCurrent.hasRecursion;   // ЗАПОМИНАЕМ

        if (hadExistingCycles) {
            this.logger.warn(
                `Текущая модель уже содержит ${recursionCurrent.cycles.length} циклических зависимостей. ` +
                `Слияние будет выполнено, но после него циклы могут остаться.`,
            );
        }

        // 4. Определяем тип коммита
        const commitType = commit.commit.desc?.commit_type || commit.type;

        // 5. Выполняем слияние
        const mergedModel = this.performMerge(currentModel, commit.commit, commitType);

        // 6. Проверяем дубликаты в смерженной модели относительно исходной
        const duplicateCheckResult = this.checkDuplicatesAfterMerge(currentModel, mergedModel);
        if (!duplicateCheckResult.allowed) {
            throw new BadRequestException(
                `Коммит создаёт новые дубликаты сущностей: ${duplicateCheckResult.newDuplicates.join(', ')}. Операция отклонена.`
            );
        }
        if (duplicateCheckResult.existingDuplicates.length > 0) {
            this.logger.warn(
                `В исходной модели уже есть дубликаты (${duplicateCheckResult.existingDuplicates.length}), они будут сохранены.`
            );
        }

        // 7. Проверяем рекурсию в результирующей модели
        const recursionMerged = this.structureValidator.checkForRecursion(
            mergedModel.entities,
            mergedModel.mappings,
        );

        // 8. Дополнительная проверка целостности смерженного JSON (необязательно)
        const integrityWarnings = this.validateMergedJsonIntegrity(mergedModel);
        if (integrityWarnings.length > 0) {
            this.logger.warn(
                `Обнаружены проблемы целостности в смерженном JSON: ${integrityWarnings.length}`,
                { warnings: integrityWarnings.slice(0, 10) }
            );
        }

        // 9. Вычисляем diff
        const diff = this.diffService.computeDiff(currentModel, mergedModel);

        // 10. Создаём сессию
        const mergeSessionId = uuidv4();
        this.mergeSessions.set(mergeSessionId, {
            commitId,
            originalJson: currentModel,
            mergedJson: mergedModel,
            diff,
            timestamp: new Date(),
            hadExistingCycles,
        });

        // 11. Подсчёт статистики
        const stats = this.calculateChangeStats(diff);

        this.logger.log(`Слияние применено, сессия: ${mergeSessionId}`);

        return {
            mergeSessionId,
            mergedJson: mergedModel,
            diff,
            changedEntitiesCount: stats.entities,
            changedAttributesCount: stats.attributes,
            changedMappingsCount: stats.mappings,
        };
    }

    /**
     * Основная логика слияния.
     */
    private performMerge(
        currentModel: JsonExportResponseDto,
        commitJson: any,
        commitType: string,
    ): JsonExportResponseDto {
        const merged = JSON.parse(JSON.stringify(currentModel));

        // --- Копируем информацию о процессе и типе коммита из коммита ---
        if (commitJson.desc) {
            // process – имя процесса (обязательно для table/model)
            if (commitJson.desc.process) {
                merged.desc.process = commitJson.desc.process;
            }
            // description – описание процесса (опционально)
            if (commitJson.desc.description) {
                merged.desc.description = commitJson.desc.description;
            }
            // commit_type – тип коммита (table/json/model)
            if (commitJson.desc.commit_type) {
                merged.desc.commit_type = commitJson.desc.commit_type;
            }
        }

        // 1. Обработка сущностей (для всех типов коммитов)
        this.mergeEntities(merged, commitJson.entities || []);

        // 2. Обработка маппингов (только для table и model)
        if (commitType === 'table' || commitType === 'model') {
            this.mergeMappings(merged, commitJson.mappings || []);
        }
        // Для json-коммита маппинги игнорируются

        // 3. Обновляем дату изменения (текущее время)
        merged.desc.change_date = new Date().toISOString();

        return merged;
    }

    /**
     * Слияние сущностей:
     * - Для каждой сущности из коммита ищем в основе по id (включает system_code)
     * - Если найдена: добавляем только новые атрибуты из коммита в attrSeq
     * - Если не найдена: добавляем всю сущность из коммита
     */
    private mergeEntities(merged: JsonExportResponseDto, commitEntities: any[]): void {
        for (const commitEntity of commitEntities) {
            const existingIndex = merged.entities.findIndex(e => e.id === commitEntity.id);

            if (existingIndex >= 0) {
                // Сущность уже есть – добавляем новые атрибуты
                const existingAttrs = new Set(
                    merged.entities[existingIndex].attrSeq.map(a => a.name.toLowerCase())
                );
                const newAttrs = (commitEntity.attrSeq || []).filter(a =>
                    !existingAttrs.has(a.name.toLowerCase())
                );

                if (newAttrs.length > 0) {
                    merged.entities[existingIndex].attrSeq.push(...newAttrs);
                    this.logger.debug(`Добавлено ${newAttrs.length} новых атрибутов к сущности ${commitEntity.id}`);
                }
            } else {
                // Новой сущности нет – добавляем полностью
                merged.entities.push(commitEntity);
                this.logger.debug(`Добавлена новая сущность ${commitEntity.id}`);
            }
        }
    }

    /**
     * Слияние маппингов:
     * - Для каждого mapping из коммита ищем в основе по entityId
     * - Если не найден – добавляем весь mapping
     * - Если найден:
     *   - Для каждого deps из коммита ищем в основе deps с таким же source_entity_id и process_id
     *   - Если найден – заменяем этот deps (attrMaps и atrDeps) новым из коммита
     *   - Если не найден – добавляем новый deps
     */
    private mergeMappings(merged: JsonExportResponseDto, commitMappings: any[]): void {
        for (const commitMapping of commitMappings) {
            const existingMappingIndex = merged.mappings.findIndex(m => m.entityId === commitMapping.entityId);

            if (existingMappingIndex === -1) {
                // Маппинг для данной цели отсутствует – добавляем целиком
                merged.mappings.push(commitMapping);
                continue;
            }

            const existingMapping = merged.mappings[existingMappingIndex];

            // Для каждого deps из коммита
            for (const commitDep of commitMapping.deps || []) {
                // Ищем в основе deps с таким же source_entity_id и process_id
                const existingDepIndex = existingMapping.deps.findIndex(d =>
                    d.entityId === commitDep.entityId && d.process_id === commitDep.process_id
                );

                if (existingDepIndex >= 0) {
                    // Заменяем существующий deps новым из коммита
                    existingMapping.deps[existingDepIndex] = { ...commitDep };
                } else {
                    // Добавляем новый deps
                    existingMapping.deps.push({ ...commitDep });
                }
            }
            // Сортируем deps по process_id
            existingMapping.deps.sort((a, b) => (a.process_id ?? 0) - (b.process_id ?? 0));
        }
    }

    private validateMergedJsonIntegrity(mergedJson: JsonExportResponseDto): string[] {
        const warnings: string[] = [];
        const entityMap = new Map(mergedJson.entities.map(e => [e.id, e]));

        for (const mapping of mergedJson.mappings || []) {
            for (const dep of mapping.deps || []) {
                const sourceEntity = entityMap.get(dep.entityId);
                if (!sourceEntity) {
                    warnings.push(`Source entity not found: ${dep.entityId}`);
                    continue;
                }
                const sourceAttrsLower = new Map(
                    sourceEntity.attrSeq.map(a => [a.name.toLowerCase(), a])
                );
                for (const attrMap of dep.attrMaps || []) {
                    if (!sourceAttrsLower.has(attrMap.src.toLowerCase())) {
                        warnings.push(`Source attribute '${attrMap.src}' not found in entity ${dep.entityId}`);
                    }
                }
                for (const attrDep of dep.atrDeps || []) {
                    if (!sourceAttrsLower.has(attrDep.attr.toLowerCase())) {
                        warnings.push(`Attribute dependency '${attrDep.attr}' not found in entity ${dep.entityId}`);
                    }
                }
            }
        }
        return warnings;
    }

    private calculateChangeStats(diff: MergeDiffDto[]): {
        entities: number;
        attributes: number;
        mappings: number;
    } {
        let entities = 0;
        let attributes = 0;
        let mappings = 0;

        for (const change of diff) {
            if (change.path.startsWith('/entities')) {
                entities++;
            } else if (change.path.startsWith('/attributes')) {
                attributes++;
            } else if (change.path.startsWith('/mappings')) {
                mappings++;
            }
        }

        return { entities, attributes, mappings };
    }

    async confirmMerge(commitId: string, user?: string): Promise<{ success: boolean; snapshotId: string; message: string }> {
        this.logger.log(`Подтверждение слияния для коммита: ${commitId}`);

        // Находим активную сессию
        let session: any = null;
        let sessionId: string | null = null;
        for (const [id, sess] of this.mergeSessions.entries()) {
            if (sess.commitId === commitId) {
                session = sess;
                sessionId = id;
                break;
            }
        }

        if (!session) {
            throw new NotFoundException(`Активная сессия слияния для коммита ${commitId} не найдена`);
        }

        // Выполняем импорт смерженной модели в РБД
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Получаем пользователя (из коммита или переданный)
            const commit = await this.jsonCommitService.getCommitById(commitId);
            const finalUser = user || commit.user || 'system';

            // Выполняем импорт смерженной модели в РБД с флагами
            const importResult = await this.jsonImportService.importJsonData({
                data: session.mergedJson,
                user: finalUser,
                changeName: `Merge commit ${commit.commit_name || commitId}`,
                validated: true,
                sourceType: undefined,
                schemaVersion: session.mergedJson.desc?.schemaVersion,
                allowExistingCycles: session.hadExistingCycles,
                skipDuplicateCheck: true,
            });

            // Создаем снепшот
            const snapshot = await this.snapshotService.createSnapshot(finalUser, session.mergedJson);
            // Меняем статус коммита на 'done'
            await this.jsonCommitService.updateCommitStatus();

            await queryRunner.commitTransaction();

            // Удаляем сессию
            if (sessionId) {
                this.mergeSessions.delete(sessionId);
            }

            this.logger.log(`Слияние подтверждено, снепшот: ${snapshot.snapshot_id}`);

            return {
                success: true,
                snapshotId: snapshot.snapshot_id,
                message: 'Модель данных успешно обновлена',
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Ошибка при подтверждении слияния: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Не удалось сохранить смерженную модель');
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Отмена слияния – удаление временной сессии
     */
    async cancelMerge(commitId: string): Promise<{ success: boolean; message: string }> {
        this.logger.log(`Отмена слияния для коммита: ${commitId}`);

        let deleted = false;
        for (const [id, sess] of this.mergeSessions.entries()) {
            if (sess.commitId === commitId) {
                this.mergeSessions.delete(id);
                deleted = true;
                break;
            }
        }

        if (!deleted) {
            throw new NotFoundException(`Активная сессия слияния для коммита ${commitId} не найдена`);
        }

        return {
            success: true,
            message: 'Слияние отменено, временные данные удалены',
        };
    }

    /**
     * Получение сессии по ID (для внутреннего использования)
     */
    getMergeSession(sessionId: string) {
        return this.mergeSessions.get(sessionId);
    }

    /**
     * Проверяет, не создаёт ли слияние новых дубликатов.
     * Возвращает структуру с полем allowed (true, если нет новых дубликатов).
     */
    private checkDuplicatesAfterMerge(
        currentModel: JsonExportResponseDto,
        mergedModel: JsonExportResponseDto
    ): { allowed: boolean; newDuplicates: string[]; existingDuplicates: string[] } {
        // Функция для подсчёта вхождений id
        const countById = (entities: any[]): Map<string, number> => {
            const map = new Map<string, number>();
            for (const e of entities) {
                const id = e.id;
                map.set(id, (map.get(id) || 0) + 1);
            }
            return map;
        };

        const currentCounts = countById(currentModel.entities);
        const mergedCounts = countById(mergedModel.entities);

        const newDuplicates: string[] = [];
        const existingDuplicates: string[] = [];

        for (const [id, mergedCnt] of mergedCounts.entries()) {
            const currentCnt = currentCounts.get(id) || 0;
            if (mergedCnt > 1) {
                if (currentCnt <= 1) {
                    // Появился новый дубликат
                    newDuplicates.push(id);
                } else {
                    // Дубликат уже был
                    existingDuplicates.push(id);
                }
            }
        }

        return {
            allowed: newDuplicates.length === 0,
            newDuplicates,
            existingDuplicates,
        };
    }

}
