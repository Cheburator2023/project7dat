import { Controller, Post, Body, Headers } from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBody,
	ApiBearerAuth,
	ApiHeader,
} from "@nestjs/swagger";
import { JsonMappingService } from "../services/json-mapping.service";
import { DependencyCheckService } from "../services/dependency-check.service";
import { EntityTypeService } from "../services/entity-type.service";
import { AttributeTypeService } from "../services/attribute-type.service";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";

@ApiBearerAuth("JWT-auth")
@ApiTags("Валидация JSON")
@Controller("json-validation")
export class JsonValidationController {
	constructor(
		private readonly jsonMappingService: JsonMappingService,
		private readonly dependencyCheckService: DependencyCheckService,
		private readonly entityTypeService: EntityTypeService,
		private readonly attributeTypeService: AttributeTypeService,
	) {}

	@Post("validate")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Предварительная валидация JSON перед импортом",
		description:
			"Проверяет JSON данные на корректность и выявляет потенциальные проблемы",
	})
	@ApiBody({
		description: "JSON данные для валидации",
		schema: {
			type: "object",
			properties: {
				data: {
					type: "object",
					example: { desc: {}, entities: [], mappings: [] },
				},
			},
		},
	})
	@ApiHeader({
		name: "x-user",
		description: "Идентификатор пользователя для аудита операций валидации",
		required: false,
		schema: {
			type: "string",
			example: "ivanov",
		},
	})
	@ApiResponse({
		status: 200,
		description: "Результаты валидации",
		schema: {
			type: "object",
			properties: {
				isValid: { type: "boolean" },
				errors: { type: "array", items: { type: "string" } },
				warnings: { type: "array", items: { type: "string" } },
				info: { type: "array", items: { type: "string" } },
				entityTypes: { type: "array", items: { type: "string" } },
				attributeTypes: { type: "array", items: { type: "string" } },
			},
		},
	})
	async validateJson(
		@Body() body: { data: any },
		@Headers("x-user") _userHeader: string,
	) {
		const { data } = body;
		const errors: string[] = [];
		const warnings: string[] = [];
		const info: string[] = [];

		// Базовая валидация структуры
		const structureValidation =
			this.jsonMappingService.validateJsonStructure(data);
		if (!structureValidation.isValid) {
			errors.push(...structureValidation.errors);
		}

		// Проверка типов сущностей
		if (data.entities && Array.isArray(data.entities)) {
			for (const entity of data.entities) {
				if (entity.type) {
					const isValidType = await this.entityTypeService.validateEntityType(
						entity.type,
					);
					if (!isValidType) {
						warnings.push(
							`Неизвестный тип сущности: "${entity.type}" для "${entity.id}"`,
						);
					}
				}
			}
		}

		// Проверка типов атрибутов
		if (data.entities && Array.isArray(data.entities)) {
			for (const entity of data.entities) {
				if (entity.attrSeq && Array.isArray(entity.attrSeq)) {
					for (const attr of entity.attrSeq) {
						if (attr.type) {
							const isValidType =
								await this.attributeTypeService.validateAttributeType(
									attr.type,
								);
							if (!isValidType) {
								warnings.push(
									`Неизвестный тип атрибута: "${attr.type}" для атрибута "${attr.name}" в сущности "${entity.id}"`,
								);
							}
						}
					}
				}
			}
		}

		// Проверка зависимостей для модифицированных витрин
		const modifiedEntities = (data.entities || []).filter(
			(entity: any) => entity.modified,
		);
		if (modifiedEntities.length > 0) {
			const processId =
				await this.jsonMappingService.getProcessIdFromData(data);
			const safetyCheck = await this.dependencyCheckService.isSafeToUpdate(
				modifiedEntities.map((e: any) => e.id),
				processId,
			);

			if (!safetyCheck.safe) {
				warnings.push(...safetyCheck.warnings);
			}
		}

		// Информационные сообщения
		if (data.entities) {
			info.push(`Обнаружено сущностей: ${data.entities.length}`);
		}
		if (data.mappings) {
			info.push(`Обнаружено маппингов: ${data.mappings.length}`);
		}

		const entityTypes = await this.entityTypeService.getSupportedEntityTypes();
		const attributeTypes =
			await this.attributeTypeService.getSupportedAttributeTypes();

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			info,
			entityTypes,
			attributeTypes,
		};
	}

	@Post("check-dependencies")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Проверка зависимостей сущностей",
		description: "Проверяет использование сущностей в других процессах",
	})
	@ApiBody({
		description: "Список сущностей для проверки",
		schema: {
			type: "object",
			properties: {
				entityFullNames: {
					type: "array",
					items: { type: "string" },
					example: ["schema1.table1", "schema2.view1"],
				},
				currentProcessId: {
					type: "number",
					example: 1,
				},
			},
		},
	})
	@ApiResponse({
		status: 200,
		description: "Результаты проверки зависимостей",
		schema: {
			type: "object",
			properties: {
				hasConflicts: { type: "boolean" },
				conflicts: {
					type: "array",
					items: {
						type: "object",
						properties: {
							entityName: { type: "string" },
							processes: { type: "array", items: { type: "string" } },
						},
					},
				},
			},
		},
	})
	async checkDependencies(
		@Body() body: { entityFullNames: string[]; currentProcessId?: number },
	) {
		const { entityFullNames, currentProcessId } = body;

		if (!entityFullNames || !Array.isArray(entityFullNames)) {
			throw new Error("entityFullNames должен быть массивом");
		}

		return await this.dependencyCheckService.checkMartUsage(
			entityFullNames,
			currentProcessId,
		);
	}
}
