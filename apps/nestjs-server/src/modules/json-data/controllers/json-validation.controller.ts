import { Controller, Post, Body, Headers } from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBody,
	ApiBearerAuth,
    ApiHeader,
} from "@nestjs/swagger";
import { JsonValidationOrchestratorService } from "../services/json-validation-orchestrator.service";
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
        private readonly validationOrchestrator: JsonValidationOrchestratorService,
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
        name: 'x-user',
        description: 'Идентификатор пользователя для аудита операций валидации',
        required: false,
        schema: {
            type: 'string',
            example: 'ivanov'
        }
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

        const validationResult = await this.validationOrchestrator.validate(data);
        const entityTypes = await this.entityTypeService.getSupportedEntityTypes();
        const attributeTypes = await this.attributeTypeService.getSupportedAttributeTypes();

        return {
            isValid: validationResult.isValid,
            errors: validationResult.validation.errors,
            warnings: validationResult.validation.warnings,
            info: [
                `Обнаружено сущностей: ${validationResult.statistics.entitiesCount}`,
                `Обнаружено маппингов: ${validationResult.statistics.mappingsCount}`,
            ],
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
