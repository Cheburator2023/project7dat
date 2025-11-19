import {
	BadRequestException,
	Injectable,
	NotFoundException,
	Optional,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { JsonDataEntity } from "../entities/json-data.entity";
import {
	CreateJsonDataInput,
	GetJsonDataListInput,
	UpdateJsonDataInput,
} from "../schemas/json-data.schema";
import { CommitJsonDataInput } from "../schemas/json-commit.schema";
import { JsonCommitService } from "./json-commit.service";
import { ChangelogService } from "../../changelog/services/changelog.service";
import { VersionInfoDto } from "../dto/version-info.dto";
import { JsonCommitEntity } from "../entities/json-commit.entity";
import { CommitStatus } from "../dto/commit-status.dto";

@Injectable()
export class JsonDataService {
	constructor(
		@Optional()
		@InjectRepository(JsonDataEntity)
		private readonly jsonDataRepository: Repository<JsonDataEntity>,
		@Optional()
		@InjectRepository(JsonCommitEntity)
		private readonly commitRepository: Repository<JsonCommitEntity>,
		readonly _configService: ConfigService,
		private readonly jsonCommitService: JsonCommitService,
		private readonly changelogService: ChangelogService,
	) {}

	async createGraphData(
		input: CreateJsonDataInput & { authorName?: string },
	): Promise<any> {
		const name = input.name || `JSON ${new Date().toLocaleString("ru-RU")}`;
		const description = input.description || "Инициализация json данных";
		const version = input.version || "1.0.0";

		const jsonData = this.jsonDataRepository.create({
			id: uuidv4(),
			name,
			data: input.data,
			description,
			version,
			authorName: input.authorName || "System",
			isCurrent: false,
		});
		const result = await this.jsonDataRepository.save(jsonData);

		await this.changelogService.logGraphCreated(result.id, result.name);
		return result;
	}

	async createDataWithId(
		id: string,
		input: CreateJsonDataInput & { authorName?: string },
	): Promise<any> {
		const name = input.name || `JSON ${new Date().toLocaleString("ru-RU")}`;
		const description = input.description || "Инициализация json данных";
		const version = input.version || "1.0.0";

		const jsonData = this.jsonDataRepository.create({
			id,
			name,
			data: input.data,
			description,
			version,
			authorName: input.authorName || "System",
			isCurrent: false,
		});
		return this.jsonDataRepository.save(jsonData);
	}

	async getAllGraphsWithPagination(
		input: GetJsonDataListInput,
	): Promise<{ data: any[]; total: number }> {
		const { page, limit, search } = input;
		const skip = (page - 1) * limit;

		const whereCondition = search
			? [{ name: Like(`%${search}%`) }, { description: Like(`%${search}%`) }]
			: {};

		const [data, total] = await this.jsonDataRepository.findAndCount({
			where: whereCondition,
			skip,
			take: limit,
			order: { createdAt: "DESC" },
		});

		return { data, total };
	}

	async getGraphDataById(id: string): Promise<any> {
		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		if (!jsonData) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}
		return jsonData;
	}

	async findGraphDataByIdOrNull(id: string): Promise<any | null> {
		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		return jsonData || null;
	}

	async getLatestGraphData(): Promise<any> {
		const currentData = await this.jsonDataRepository.findOne({
			where: { isCurrent: true },
		});
		if (currentData) {
			return currentData;
		}

		const latestList = await this.jsonDataRepository.find({
			order: { createdAt: "DESC" },
			take: 1,
		});
		return latestList.length ? latestList[0] : undefined;
	}

	async updateGraphData(
		id: string,
		input: UpdateJsonDataInput & { authorName?: string },
	): Promise<any> {
		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		if (!jsonData) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}

		if (input.data) jsonData.data = input.data;
		if (input.name) jsonData.name = input.name;
		if (input.description) jsonData.description = input.description;
		if (input.authorName) jsonData.authorName = input.authorName;
		jsonData.updatedAt = new Date();

		return this.jsonDataRepository.save(jsonData);
	}

	async initializeGraphWithData(
		input: CreateJsonDataInput & { authorName?: string },
	): Promise<any> {
		const graphData = await this.createGraphData(input);
		console.log(`[JsonDataService] Graph created with ID: ${graphData.id}`);

		await this.jsonCommitService.createInitialCommit(
			graphData.id,
			"Initial commit",
			input.data,
			input.authorName,
		);
		console.log(
			`[JsonDataService] Initial commit created for graph: ${graphData.id}`,
		);

		console.log(`[JsonDataService] Graph ${graphData.id} created successfully`);

		return graphData;
	}

	async createCommitForCurrentGraph(
		commitInput: CommitJsonDataInput & { authorName?: string },
	): Promise<any> {
		console.log(
			`[JsonDataService] createCommitForCurrentGraph called with message: ${commitInput.message}`,
		);
		let currentData = await this.getLatestGraphData();

		if (!currentData) {
			throw new NotFoundException(
				"No graph data found. Please initialize a graph first.",
			);
		}

		const updateInput: UpdateJsonDataInput & { authorName?: string } = {
			data: commitInput.data,
			authorName: commitInput.authorName,
		};
		currentData = await this.updateGraphData(currentData.id, updateInput);

		// Check if there are any existing commits for this graph
		const existingCommits =
			await this.jsonCommitService.getCommitsWithPagination({
				page: 1,
				limit: 1,
				graphId: currentData.id,
			});

		if (existingCommits.total === 0) {
			// No commits exist, create initial commit
			await this.jsonCommitService.createInitialCommit(
				currentData.id,
				commitInput.message,
				commitInput.data,
				commitInput.authorName,
			);
		} else {
			// Commits exist, create new commit
			await this.jsonCommitService.createNewCommit(
				currentData.id,
				commitInput.message,
				commitInput.data,
				commitInput.authorName,
			);
		}

		return currentData;
	}

	async updateGraphWithCommit(
		id: string,
		commitInput: CommitJsonDataInput & { authorName?: string },
	): Promise<any> {
		console.log(
			`[JsonDataService] updateGraphWithCommit вызван для graphId: ${id}`,
		);
		const existingData = await this.findGraphDataByIdOrNull(id);

		if (!existingData) {
			console.log(`[JsonDataService] JSON с ID ${id} не найден, создаем новый`);
			const name = `JSON ${new Date().toLocaleString("ru-RU")}`;
			const description = "Автоматически созданный JSON для коммита";
			const newGraphData = await this.createGraphData({
				name,
				data: commitInput.data,
				description,
				version: "1.0.0",
				authorName: commitInput.authorName || "System",
			});

			console.log(
				`[JsonDataService] Создан новый JSON с ID: ${newGraphData.id}`,
			);
			await this.jsonCommitService.createInitialCommit(
				newGraphData.id,
				commitInput.message,
				commitInput.data,
				commitInput.authorName,
			);

			return newGraphData;
		}

		console.log(`[JsonDataService] JSON с ID ${id} найден, обновляем`);
		const updateInput: UpdateJsonDataInput & { authorName?: string } = {
			data: commitInput.data,
			authorName: commitInput.authorName || "System",
		};

		const updatedData = await this.updateGraphData(id, updateInput);

		console.log(
			`[JsonDataService] JSON обновлен, создаем коммит для ID: ${id}`,
		);
		await this.jsonCommitService.createNewCommit(
			id,
			commitInput.message,
			commitInput.data,
			commitInput.authorName,
		);

		return updatedData;
	}

	async updateVersionInfo(
		id: string,
		versionInfo: VersionInfoDto,
	): Promise<any> {
		await this.jsonDataRepository.update(id, {
			version: versionInfo.version,
			deprecated: versionInfo.deprecated,
		});
		return this.jsonDataRepository.findOne({ where: { id } });
	}

	async getDocumentHistory(
		id: string,
		fromDate?: string,
		toDate?: string,
	): Promise<any[]> {
		const query: any = { graphId: id };

		if (fromDate || toDate) {
			query.createdAt = {};
			if (fromDate) query.createdAt.$gte = new Date(fromDate);
			if (toDate) query.createdAt.$lte = new Date(toDate);
		}

		return this.commitRepository.find({
			where: query,
			order: { createdAt: "DESC" },
		});
	}

	async deleteGraphData(id: string): Promise<void> {
		const result = await this.jsonDataRepository.delete(id);
		if (result.affected === 0) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}
		return;
	}

	async setCurrentById(id: string): Promise<any> {
		await this.jsonDataRepository.update({}, { isCurrent: false });

		const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
		if (!jsonData) {
			throw new NotFoundException(`JSON с ID ${id} не найден`);
		}

		jsonData.isCurrent = true;
		const result = await this.jsonDataRepository.save(jsonData);

		await this.changelogService.logSetCurrent(result.id, result.name);
		return result;
	}

	async setCurrentFromSnapshot(snapshot: any): Promise<any> {
		const updateData: CreateJsonDataInput & { authorName?: string } = {
			name: snapshot.name,
			data: snapshot.data,
			description: `Восстановлено из снимка: ${snapshot.name}`,
			version: snapshot.version || "1.0.0",
			authorName: snapshot.authorName || "System",
		};

		const existingData = await this.findGraphDataByIdOrNull(
			snapshot.sourceDataId,
		);

		if (existingData) {
			await this.updateGraphData(snapshot.sourceDataId, updateData);
			return await this.setCurrentById(snapshot.sourceDataId);
		}
		const created = await this.createDataWithId(
			snapshot.sourceDataId,
			updateData,
		);
		return await this.setCurrentById(created.id);
	}

	/**
	 * Применение коммита к JSON данным: восстанавливает полные данные на момент
	 * указанного коммита и обновляет соответствующий JsonDataEntity.
	 */
	async applyCommitById(commitId: string): Promise<any> {
		// Находим таргетный коммит и его граф
		const targetCommit = await this.jsonCommitService.findCommitById(commitId);
		if (!targetCommit) {
			throw new NotFoundException(`Коммит с ID ${commitId} не найден`);
		}

		const graphId = targetCommit.graphId;

		// Восстанавливаем полные данные на момент коммита
		const cumulativeData =
			await this.jsonCommitService.getCumulativeDataAtCommit(commitId);
		if (!cumulativeData) {
			throw new NotFoundException(
				`Не удалось восстановить данные для коммита ${commitId}`,
			);
		}

		// Метод getCumulativeDataAtCommit может возвращать либо только данные,
		// либо объект с полным описанием. Поддерживаем оба варианта для
		// обратной совместимости.
		const fullData =
			"fullData" in cumulativeData ? cumulativeData.fullData : cumulativeData;

		// Ищем существующий JSON
		const existingData = await this.findGraphDataByIdOrNull(graphId);
		let result: any;

		if (!existingData) {
			// Если JSON еще не существует, создаем его с указанным graphId
			const name =
				targetCommit.jsonData?.name ||
				targetCommit.message ||
				`JSON ${new Date().toLocaleString("ru-RU")}`;
			const description =
				targetCommit.jsonData?.description ||
				`Создан из коммита ${targetCommit.id}`;

			const jsonData = this.jsonDataRepository.create({
				id: graphId,
				name,
				data: fullData,
				description,
				version: targetCommit.version || "1.0.0",
				authorName: targetCommit.authorName || "System",
				isCurrent: false,
			});

			result = await this.jsonDataRepository.save(jsonData);
		} else {
			// Обновляем существующий JSON данными из коммита
			existingData.data = fullData;
			existingData.updatedAt = new Date();
			result = await this.jsonDataRepository.save(existingData);
		}

		// Помечаем граф как текущий
		await this.setCurrentById(result.id);

		// Обновляем статус коммита, чтобы он больше не считался частью очереди
		await this.jsonCommitService.updateCommitStatus(
			commitId,
			CommitStatus.APPLIED,
		);

		return result;
	}

	/**
	 * Частичное применение коммита по списку выбранных сущностей.
	 * selectedEntityIds содержит ID entities, для которых нужно применить изменения
	 * из таргетной схемы на момент коммита.
	 */
	async applyPartialCommitById(
		commitId: string,
		selectedEntityIds: string[],
	): Promise<any> {
		if (!selectedEntityIds || selectedEntityIds.length === 0) {
			throw new BadRequestException(
				"Не выбраны сущности для частичного применения коммита",
			);
		}

		// Находим таргетный коммит и его граф
		const targetCommit = await this.jsonCommitService.findCommitById(commitId);
		if (!targetCommit) {
			throw new NotFoundException(`Коммит с ID ${commitId} не найден`);
		}

		const graphId = targetCommit.graphId;

		// Восстанавливаем полные данные на момент коммита
		const cumulativeData =
			await this.jsonCommitService.getCumulativeDataAtCommit(commitId);
		if (!cumulativeData) {
			throw new NotFoundException(
				`Не удалось восстановить данные для коммита ${commitId}`,
			);
		}

		const targetFullData =
			"fullData" in cumulativeData
				? (cumulativeData.fullData as any)
				: (cumulativeData as any);

		// Текущая модель (baseline)
		const existingData = await this.findGraphDataByIdOrNull(graphId);
		let baselineSchema: any | null = existingData?.data ?? null;

		// Если baseline отсутствует, считаем его пустой схемой с desc из таргета
		if (!baselineSchema) {
			baselineSchema = {
				...(targetFullData.desc ? { desc: targetFullData.desc } : {}),
				entities: [],
				mappings: [],
			};
		}

		const baselineEntitiesById = new Map<string, any>();
		const targetEntitiesById = new Map<string, any>();

		for (const entity of baselineSchema.entities ?? []) {
			if (entity?.id) {
				baselineEntitiesById.set(entity.id, entity);
			}
		}

		for (const entity of targetFullData.entities ?? []) {
			if (entity?.id) {
				targetEntitiesById.set(entity.id, entity);
			}
		}

		const selectedIdsSet = new Set<string>(selectedEntityIds);
		const finalEntities: any[] = [];

		// 1. Обрабатываем сущности, которые уже есть в baseline
		for (const [id, baselineEntity] of baselineEntitiesById.entries()) {
			const targetEntity = targetEntitiesById.get(id);
			const isSelected = selectedIdsSet.has(id);

			if (!isSelected) {
				// Сущность не выбрана - оставляем baseline-версию
				finalEntities.push(baselineEntity);
			} else {
				// Сущность выбрана
				if (targetEntity) {
					// Измененная сущность - берем версию из таргета
					finalEntities.push(targetEntity);
				}
				// Если сущность есть только в baseline и отсутствует в target,
				// считаем, что коммит ее удаляет и при выборе удаляем ее.
			}
		}

		// 2. Новые сущности (есть только в target)
		for (const [id, targetEntity] of targetEntitiesById.entries()) {
			const inBaseline = baselineEntitiesById.has(id);
			const isSelected = selectedIdsSet.has(id);

			if (!inBaseline && isSelected) {
				finalEntities.push(targetEntity);
			}
		}

		const finalEntityIds = new Set<string>(
			finalEntities.map((entity) => entity.id).filter(Boolean),
		);

		// 3. Маппинги: группируем по entityId и выбираем из baseline или target
		const baselineMappingsByEntityId = new Map<string, any[]>();
		const targetMappingsByEntityId = new Map<string, any[]>();

		for (const mapping of baselineSchema.mappings ?? []) {
			if (!mapping?.entityId) continue;
			const list = baselineMappingsByEntityId.get(mapping.entityId) ?? [];
			list.push(mapping);
			baselineMappingsByEntityId.set(mapping.entityId, list);
		}

		for (const mapping of targetFullData.mappings ?? []) {
			if (!mapping?.entityId) continue;
			const list = targetMappingsByEntityId.get(mapping.entityId) ?? [];
			list.push(mapping);
			targetMappingsByEntityId.set(mapping.entityId, list);
		}

		const finalMappings: any[] = [];

		for (const entityId of finalEntityIds) {
			const isSelected = selectedIdsSet.has(entityId);
			const sourceMappings = isSelected
				? (targetMappingsByEntityId.get(entityId) ?? [])
				: (baselineMappingsByEntityId.get(entityId) ?? []);

			for (const mapping of sourceMappings) {
				const allEntityIds = [
					mapping.entityId,
					...(mapping.deps?.map((dep: any) => dep.entityId) ?? []),
				];
				const allExist = allEntityIds.every((id: string) =>
					finalEntityIds.has(id),
				);
				if (!allExist) continue;

				finalMappings.push(mapping);
			}
		}

		const baseForMeta = baselineSchema || targetFullData;

		const finalSchema = {
			...baseForMeta,
			entities: finalEntities,
			mappings: finalMappings,
		};

		let result: any;

		if (!existingData) {
			const name =
				targetCommit.jsonData?.name ||
				targetCommit.message ||
				`JSON ${new Date().toLocaleString("ru-RU")}`;
			const description =
				targetCommit.jsonData?.description ||
				`Создан частичным применением коммита ${targetCommit.id}`;

			const jsonData = this.jsonDataRepository.create({
				id: graphId,
				name,
				data: finalSchema,
				description,
				version: targetCommit.version || "1.0.0",
				authorName: targetCommit.authorName || "System",
				isCurrent: false,
			});

			result = await this.jsonDataRepository.save(jsonData);
		} else {
			existingData.data = finalSchema;
			existingData.updatedAt = new Date();
			result = await this.jsonDataRepository.save(existingData);
		}

		await this.setCurrentById(result.id);

		await this.jsonCommitService.updateCommitStatus(
			commitId,
			CommitStatus.APPLIED,
		);

		return result;
	}
}
