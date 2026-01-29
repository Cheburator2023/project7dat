import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EntityContainerService {
	private containerCache: Map<string, number> = new Map();
	private defaultContainerTypeId: number | null = null;

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

		// Получаем или создаем тип контейнера по умолчанию
		const containerTypeId = await this.getOrCreateDefaultContainerType(
			changeId,
			queryRunner,
		);

		// Создаем новый контейнер
		const insertQuery = `
            INSERT INTO entity_container
                (change_id, entity_container_type_id, value, description)
            VALUES ($1, $2, $3, $4)
            RETURNING entity_container_id
        `;

		const newContainer = await queryRunner.query(insertQuery, [
			changeId,
			containerTypeId,
			namespace,
			`Автоматически созданный контейнер для ${namespace}`,
		]);

		const containerId = newContainer[0].entity_container_id;
		this.containerCache.set(namespace, containerId);

		return containerId;
	}

	/**
	 * Получение или создание типа контейнера по умолчанию
	 */
	private async getOrCreateDefaultContainerType(
		changeId: number,
		queryRunner: any,
	): Promise<number> {
		// Используем кэш
		if (this.defaultContainerTypeId !== null) {
			return this.defaultContainerTypeId;
		}

		// Ищем существующий тип "DEFAULT" или любой первый тип
		const findTypeQuery = `
			SELECT entity_container_type_id
			FROM entity_container_type
			ORDER BY entity_container_type_id
			LIMIT 1
		`;

		const existingType = await queryRunner.query(findTypeQuery);

		if (existingType.length > 0) {
			this.defaultContainerTypeId = existingType[0].entity_container_type_id;
			return this.defaultContainerTypeId as number;
		}

		// Создаем новый тип контейнера "DEFAULT"
		const insertTypeQuery = `
			INSERT INTO entity_container_type (change_id, value, description)
			VALUES ($1, $2, $3)
			RETURNING entity_container_type_id
		`;

		const newType = await queryRunner.query(insertTypeQuery, [
			changeId,
			"DEFAULT",
			"Тип контейнера по умолчанию",
		]);

		this.defaultContainerTypeId = newType[0].entity_container_type_id;
		return this.defaultContainerTypeId as number;
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
		this.defaultContainerTypeId = null;
	}
}
