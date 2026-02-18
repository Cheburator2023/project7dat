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

        // 3. Определяем тип коммита
        const commitType = commit.commit.desc?.commit_type || commit.type;

        // 4. Выполняем слияние
        const mergedModel = this.performMerge(currentModel, commit.commit, commitType);

        // 5. Вычисляем diff
        const diff = this.diffService.computeDiff(currentModel, mergedModel);

        // 6. Создаем сессию
        const mergeSessionId = uuidv4();
        this.mergeSessions.set(mergeSessionId, {
            commitId,
            originalJson: currentModel,
            mergedJson: mergedModel,
            diff,
            timestamp: new Date(),
        });

        // 7. Подсчет статистики
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

        // 1. Обработка сущностей (для всех типов коммитов)
        this.mergeEntities(merged, commitJson.entities || []);

        // 2. Обработка маппингов (только для table и model)
        if (commitType === 'table' || commitType === 'model') {
            this.mergeMappings(merged, commitJson.mappings || []);
        }
        // Для json-коммита маппинги игнорируются

        // 3. Обновляем дату изменения
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
                const existingAttrs = new Set(merged.entities[existingIndex].attrSeq.map(a => a.name));
                const newAttrs = (commitEntity.attrSeq || []).filter(a => !existingAttrs.has(a.name));

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
                    existingMapping.deps[existingDepIndex] = commitDep;
                } else {
                    // Добавляем новый deps
                    existingMapping.deps.push(commitDep);
                }
            }

            // Сортируем deps по process_id (как требуется в документации)
            existingMapping.deps.sort((a, b) => {
                const pidA = a.process_id ?? 0;
                const pidB = b.process_id ?? 0;
                return pidA - pidB;
            });
        }
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

            // Импортируем смерженную модель
            const importResult = await this.jsonImportService.importJsonData({
                data: session.mergedJson,
                user: finalUser,
                changeName: `Merge commit ${commit.commit_name || commitId}`,
                validated: true,
                sourceType: undefined,
                schemaVersion: session.mergedJson.desc?.schemaVersion,
            });

            // Создаем снепшот
            const snapshot = await this.snapshotService.createSnapshot(
                finalUser,
                session.mergedJson,
            );

            // Меняем статус коммита на 'done'
            await this.jsonCommitService.updateCommitStatus(); // обновляет все processing → done

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
}
