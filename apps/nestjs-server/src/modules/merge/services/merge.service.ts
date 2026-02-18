import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
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

        // 3. Выполняем слияние
        const mergedModel = this.performMerge(currentModel, commit.commit);

        // 4. Вычисляем diff
        const diff = this.diffService.computeDiff(currentModel, mergedModel);

        // 5. Создаем сессию
        const mergeSessionId = uuidv4();
        this.mergeSessions.set(mergeSessionId, {
            commitId,
            originalJson: currentModel,
            mergedJson: mergedModel,
            diff,
            timestamp: new Date(),
        });

        // 6. Подсчет статистики
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
     * Подтверждение слияния – сохранение изменений в РБД и создание снепшота
     */
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
                validated: true, // мы уже проверили
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
     * Основная логика слияния: накладывает изменения из коммита на текущую модель.
     * Правила слияния согласно документации:
     * - Сущности с modified = true заменяют существующие (или добавляются)
     * - Сущности с modified = false игнорируются (они источники)
     * - Маппинги полностью заменяются на переданные (для целевых сущностей)
     */
    private performMerge(
        currentModel: JsonExportResponseDto,
        commitJson: any,
    ): JsonExportResponseDto {
        // Глубокое копирование
        const merged = JSON.parse(JSON.stringify(currentModel));

        // Если в коммите нет entities или mappings – возвращаем как есть
        if (!commitJson.entities || !Array.isArray(commitJson.entities)) {
            return merged;
        }
        if (!commitJson.mappings || !Array.isArray(commitJson.mappings)) {
            return merged;
        }

        // 1. Обработка сущностей: заменяем или добавляем только modified = true
        const targetEntities = commitJson.entities.filter((e: any) => e.modified === true);
        for (const targetEntity of targetEntities) {
            const index = merged.entities.findIndex((e: any) => e.id === targetEntity.id);
            if (index !== -1) {
                // Заменяем существующую
                merged.entities[index] = { ...merged.entities[index], ...targetEntity };
            } else {
                // Добавляем новую
                merged.entities.push(targetEntity);
            }
        }

        // 2. Обработка маппингов: для каждой entityId из коммита удаляем старые маппинги и добавляем новые
        const commitMappingMap = new Map<string, any>();
        for (const mapping of commitJson.mappings) {
            commitMappingMap.set(mapping.entityId, mapping);
        }

        // Удаляем маппинги, для которых есть новые в коммите
        merged.mappings = merged.mappings.filter(
            (mapping: any) => !commitMappingMap.has(mapping.entityId),
        );

        // Добавляем новые маппинги из коммита
        for (const mapping of commitJson.mappings) {
            merged.mappings.push(mapping);
        }

        // 3. Обновляем дату изменения
        merged.desc.change_date = new Date().toISOString();

        return merged;
    }

    /**
     * Подсчет статистики изменений на основе diff
     */
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

    /**
     * Получение сессии по ID (для внутреннего использования)
     */
    getMergeSession(sessionId: string) {
        return this.mergeSessions.get(sessionId);
    }
}
