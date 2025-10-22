import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { EntityEntity } from "../entities/entity.entity";
import { EntityMapEntity } from "../entities/entity-map.entity";

@Injectable()
export class DependencyCheckService {
    constructor(
        @InjectRepository(EntityEntity)
        private readonly entityRepository: Repository<EntityEntity>,
        @InjectRepository(EntityMapEntity)
        private readonly entityMapRepository: Repository<EntityMapEntity>,
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService
    ) {}

    /**
     * Проверка на использование витрин в других процессах
     */
    async checkMartUsage(
        entityFullNames: string[],
        currentProcessId?: number
    ): Promise<{ hasConflicts: boolean; conflicts: Array<{ entityName: string; processes: string[] }> }> {
        const conflicts: Array<{ entityName: string; processes: string[] }> = [];

        try {
            for (const entityFullName of entityFullNames) {
                const entity = await this.entityRepository.findOne({
                    where: { full_name: entityFullName }
                });

                if (!entity) {
                    continue;
                }

                // Ищем использование этой сущности в других процессах
                const query = `
                    SELECT DISTINCT p.name as process_name, p.process_id
                    FROM entity_map em
                             JOIN process p ON em.process_id = p.process_id
                    WHERE em.entity_id = $1
                        ${currentProcessId ? 'AND em.process_id != $2' : ''}
                `;

                const params = currentProcessId ? [entity.entity_id, currentProcessId] : [entity.entity_id];
                const usages = await this.dataSource.query(query, params);

                if (usages.length > 0) {
                    conflicts.push({
                        entityName: entityFullName,
                        processes: usages.map((usage: any) => `${usage.process_name} (ID: ${usage.process_id})`)
                    });
                }
            }

            return {
                hasConflicts: conflicts.length > 0,
                conflicts
            };
        } catch (error) {
            console.error('Ошибка при проверке зависимостей:', error);
            return {
                hasConflicts: false,
                conflicts: []
            };
        }
    }

    /**
     * Получение всех процессов, использующих указанные сущности
     */
    async getProcessesUsingEntities(entityFullNames: string[]): Promise<Map<string, string[]>> {
        const result = new Map<string, string[]>();

        try {
            for (const entityFullName of entityFullNames) {
                const entity = await this.entityRepository.findOne({
                    where: { full_name: entityFullName }
                });

                if (!entity) {
                    continue;
                }

                const query = `
                    SELECT DISTINCT p.name as process_name, p.process_id
                    FROM entity_map em
                             JOIN process p ON em.process_id = p.process_id
                    WHERE em.entity_id = $1
                `;

                const usages = await this.dataSource.query(query, [entity.entity_id]);

                if (usages.length > 0) {
                    result.set(
                        entityFullName,
                        usages.map((usage: any) => `${usage.process_name} (ID: ${usage.process_id})`)
                    );
                }
            }

            return result;
        } catch (error) {
            console.error('Ошибка при получении процессов:', error);
            return result;
        }
    }

    /**
     * Проверка безопасности удаления/обновления связей
     */
    async isSafeToUpdate(
        targetEntities: string[],
        sourceProcessId: number
    ): Promise<{ safe: boolean; warnings: string[] }> {
        const warnings: string[] = [];

        const usageCheck = await this.checkMartUsage(targetEntities, sourceProcessId);

        if (usageCheck.hasConflicts) {
            for (const conflict of usageCheck.conflicts) {
                warnings.push(
                    `Сущность "${conflict.entityName}" используется в процессах: ${conflict.processes.join(', ')}. ` +
                    `Обновление может повлиять на эти процессы.`
                );
            }
        }

        return {
            safe: warnings.length === 0,
            warnings
        };
    }
}