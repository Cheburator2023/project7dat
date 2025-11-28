import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EntityContainerService {
	private containerCache: Map<string, number> = new Map();

	constructor(
		readonly _configService: ConfigService,
		private readonly dataSource: DataSource,
	) {}

    /**
     * Разрешение entity_container по namespace
     */
    async resolveEntityContainer(
        namespace: string | null | undefined,
        changeId: number,
        queryRunner: any,
    ): Promise<number | null> {
        if (!namespace) {
            return null;
        }

		// Проверяем кэш
		if (this.containerCache.has(namespace)) {
			return this.containerCache.get(namespace)!;
		}

		// Пытаемся найти существующий контейнер
		const containerQuery = `
            SELECT entity_container_id
            FROM entity_container
            WHERE value = $1
            LIMIT 1
        `;

		const result = await queryRunner.query(containerQuery, [namespace]);

		if (result.length > 0) {
			const containerId = result[0].entity_container_id;
			this.containerCache.set(namespace, containerId);
			return containerId;
		}

		// Создаем новый контейнер
		const insertQuery = `
            INSERT INTO entity_container
                (change_id, entity_container_type_id, value, description)
            VALUES ($1, $2, $3, $4)
            RETURNING entity_container_id
        `;

		const newContainer = await queryRunner.query(insertQuery, [
			changeId,
			1, // DEFAULT_TYPE
			namespace,
			`Автоматически созданный контейнер для ${namespace}`,
		]);

		const containerId = newContainer[0].entity_container_id;
		this.containerCache.set(namespace, containerId);

		return containerId;
	}

	/**
	 * Получение информации о контейнере
	 */
	async getContainerInfo(containerId: number): Promise<any> {
		try {
			const query = `
                SELECT ec.entity_container_id, ec.value, ec.description, ect.value as type_name
                FROM entity_container ec
                         LEFT JOIN entity_container_type ect ON ec.entity_container_type_id = ect.entity_container_type_id
                WHERE ec.entity_container_id = $1
            `;

			const result = await this.dataSource.query(query, [containerId]);
			return result.length > 0 ? result[0] : null;
		} catch (error) {
			console.warn(
				`Ошибка при получении информации о контейнере ${containerId}:`,
				error,
			);
			return null;
		}
	}

	/**
	 * Очистка кэша
	 */
	clearCache(): void {
		this.containerCache.clear();
	}
}
