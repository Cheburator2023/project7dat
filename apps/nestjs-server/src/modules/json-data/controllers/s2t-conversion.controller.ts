import { Body, Controller, Post, BadRequestException } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { S2tConversionService } from "../services/s2t-conversion.service";
import { S2tToCommitJsonService } from "../services/s2t-to-commit-json.service";
import { S2tConvertRequestDto } from "../dto/requests/s2t-convert-request.dto";
import { S2tConvertResponseDto } from "../dto/responses/s2t-convert-response.dto";
import { S2tConvertToCommitRequestDto } from "../dto/requests/s2t-convert-to-commit-request.dto";
import { S2tConvertToCommitResponseDto } from "../dto/responses/s2t-convert-to-commit-response.dto";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";

@ApiBearerAuth("JWT-auth")
@ApiTags("S2T")
@Controller("s2t")
export class S2tConversionController {
	constructor(
		private readonly s2tConversionService: S2tConversionService,
		private readonly s2tToCommitJsonService: S2tToCommitJsonService,
	) {}

	@Post("convert-xlsx-to-json")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Конвертация S2T xlsx в JSON-представление workbook",
		description:
			"Принимает xlsx (base64) и возвращает JSON-представление структуры Excel (для последующего парсинга в commit JSON).",
	})
	@ApiBody({ type: S2tConvertRequestDto })
	@ApiResponse({
		status: 200,
		description: "JSON-представление workbook",
		type: S2tConvertResponseDto,
	})
	async convertXlsxToJson(
		@Body() body: S2tConvertRequestDto,
	): Promise<S2tConvertResponseDto> {
		try {
			return await this.s2tConversionService.convertXlsxBase64ToWorkbookJson({
				xlsxBase64: body.xlsxBase64,
				fileName: body.fileName,
			});
		} catch (e: any) {
			throw new BadRequestException({
				message: "Не удалось прочитать xlsx",
				error: e?.message,
			});
		}
	}

	@Post("convert-xlsx-to-commit-json")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Конвертация S2T xlsx напрямую в commit JSON",
		description:
			"Принимает xlsx (base64) и возвращает готовый commit JSON в формате DataLineageSchema для валидации и импорта.",
	})
	@ApiBody({ type: S2tConvertToCommitRequestDto })
	@ApiResponse({
		status: 200,
		description: "Commit JSON в формате DataLineageSchema",
		type: S2tConvertToCommitResponseDto,
	})
	async convertXlsxToCommitJson(
		@Body() body: S2tConvertToCommitRequestDto,
	): Promise<S2tConvertToCommitResponseDto> {
		try {
			const workbookResult =
				await this.s2tConversionService.convertXlsxBase64ToWorkbookJson({
					xlsxBase64: body.xlsxBase64,
					fileName: body.fileName,
				});

			const commitJson =
				this.s2tToCommitJsonService.convertWorkbookToCommitJson({
					workbook: workbookResult.workbook,
					fileName: body.fileName,
					processName: body.processName,
					processDescription: body.processDescription,
					commitName: body.commitName,
				});

			return {
				meta: workbookResult.meta,
				commitJson,
			};
		} catch (e: any) {
			throw new BadRequestException({
				message: "Не удалось сконвертировать S2T в commit JSON",
				error: e?.message,
			});
		}
	}
}
