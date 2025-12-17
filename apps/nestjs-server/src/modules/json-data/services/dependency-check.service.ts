import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { EntityEntity } from "../entities/entity.entity";

@Injectable()
export class DependencyCheckService {
    private readonly logger = new Logger(DependencyCheckService.name);

    constructor(
        @InjectRepository(EntityEntity)
        private readonly entityRepository: Repository<EntityEntity>,
        private readonly dataSource: DataSource,
    ) {}

	/**
	 * Проверка на использование витрин в других процессах
	 */
	async checkMartUsage(
		entityFullNames: string[],
		currentProcessId?: number,
	): Promise<{
		hasConflicts: boolean;
		conflicts: Array<{ entityName: string; processes: string[] }>;
	}> {
		const conflicts: Array<{ entityName: string; processes: string[] }> = [];

		try {
			for (const entityFullName of entityFullNames) {
				const entity = await this.entityRepository.findOne({
					where: { full_name: entityFullName },
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
                        ${currentProcessId ? "AND em.process_id != $2" : ""}
                `;

				const params = currentProcessId
					? [entity.entity_id, currentProcessId]
					: [entity.entity_id];

				const usages = await this.dataSource.query(query, params);

				if (usages.length > 0) {
					conflicts.push({
						entityName: entityFullName,
						processes: usages.map(
							(usage: any) => `${usage.process_name} (ID: ${usage.process_id})`,
						),
					});
				}
			}

			return {
				hasConflicts: conflicts.length > 0,
				conflicts,
			};
		} catch (error) {
            this.logger.error("Ошибка при проверке зависимостей:", error);
			return {
				hasConflicts: false,
				conflicts: [],
			};
		}
	}

    /**
     * Проверка рекурсивных зависимостей
     */
    async checkForRecursion(
        entities: any[],
        mappings: any[],
    ): Promise<{ hasRecursion: boolean; cycles: string[][] }> {
        const graph = new Map<string, string[]>();
        const cycles: string[][] = [];

        // Построение графа зависимостей
        entities.forEach((entity) => {
            graph.set(entity.id, []);
        });

        mappings.forEach((mapping) => {
            if (mapping.deps && Array.isArray(mapping.deps)) {
                mapping.deps.forEach((dep: any) => {
                    const source = dep.entityId;
                    const target = mapping.entityId;

                    if (graph.has(source)) {
                        graph.get(source)!.push(target);
                    }
                });
            }
        });

        // Поиск циклов с помощью DFS
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (node: string, path: string[]): boolean => {
            if (recursionStack.has(node)) {
                cycles.push([...path, node]);
                return true;
            }

            if (visited.has(node)) {
                return false;
            }

            visited.add(node);
            recursionStack.add(node);
            path.push(node);

            const neighbors = graph.get(node) || [];
            let hasCycle = false;

            for (const neighbor of neighbors) {
                if (dfs(neighbor, path)) {
                    hasCycle = true;
                }
            }

            path.pop();
            recursionStack.delete(node);
            return hasCycle;
        };

        let hasRecursion = false;
        for (const node of graph.keys()) {
            if (!visited.has(node)) {
                if (dfs(node, [])) {
                    hasRecursion = true;
                }
            }
        }

        return {
            hasRecursion,
            cycles,
        };
    }

    /**
     * Проверка безопасности удаления/обновления связей
     */
    async isSafeToUpdate(
        targetEntities: string[],
        sourceProcessId?: number,
    ): Promise<{ safe: boolean; warnings: string[] }> {
        const warnings: string[] = [];

        const usageCheck = await this.checkMartUsage(targetEntities, sourceProcessId);

        if (usageCheck.hasConflicts) {
            for (const conflict of usageCheck.conflicts) {
                warnings.push(
                    `Сущность "${conflict.entityName}" используется в процессах: ${conflict.processes.join(", ")}. ` +
                    `Обновление может повлиять на эти процессы.`,
                );
            }
        }

        return {
            safe: warnings.length === 0,
            warnings,
        };
    }

    /**
	 * Получение всех процессов, использующих указанные сущности
	 */
	async getProcessesUsingEntities(
		entityFullNames: string[],
	): Promise<Map<string, string[]>> {
		const result = new Map<string, string[]>();

		try {
			for (const entityFullName of entityFullNames) {
				const entity = await this.entityRepository.findOne({
					where: { full_name: entityFullName },
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
						usages.map(
							(usage: any) => `${usage.process_name} (ID: ${usage.process_id})`,
						),
					);
				}
			}

            return result;
        } catch (error) {
            this.logger.error("Ошибка при получении процессов:", error);
            return result;
        }
    }
}
