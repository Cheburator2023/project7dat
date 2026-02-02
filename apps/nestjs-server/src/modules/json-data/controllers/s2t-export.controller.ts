import {
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Query,
	Res,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import type { FastifyReply } from "fastify";
import { RealmRole } from "src/core/auth/decorators/realm-role.decorator";
import { Permission } from "src/core/auth/permissions";
import { S2tExportService } from "../services/s2t-export.service";

@ApiBearerAuth("JWT-auth")
@ApiTags("Экспорт S2T")
@Controller("s2t-export")
export class S2tExportController {
	constructor(private readonly s2tExportService: S2tExportService) {}

	@Get("dl")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Экспорт отчёта DL в формате S2T (.xlsx)",
		description:
			"Формирует отчёт S2T (xlsx) для одной выбранной витрины (table/view).",
	})
	@ApiQuery({
		name: "entityId",
		required: true,
		type: String,
		description: "Идентификатор витрины (полное имя, например schema.table)",
	})
	@ApiResponse({
		status: 200,
		description: "XLSX файл отчёта S2T",
	})
	async exportS2tReport(
		@Query("entityId") entityId: string,
		@Res() reply: FastifyReply,
	): Promise<void> {
		const { buffer, fileName, mimeType } =
			await this.s2tExportService.exportCurrentToXlsx({
				targetEntityId: entityId,
			});

		reply.header("Content-Type", mimeType);
		reply.header(
			"Content-Disposition",
			`attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
		);
		reply.send(buffer);
	}

	@Get("dl/change/:changeId")
	@RealmRole(Permission.DL_VIEW_JSON_DATA)
	@ApiOperation({
		summary: "Экспорт отчёта DL в формате S2T (.xlsx) по change_id",
		description:
			"Формирует отчёт S2T (xlsx) для одной выбранной витрины (table/view) на момент указанного change_id.",
	})
	@ApiParam({
		name: "changeId",
		type: Number,
		description: "Идентификатор изменения",
	})
	@ApiQuery({
		name: "entityId",
		required: true,
		type: String,
		description: "Идентификатор витрины (полное имя, например schema.table)",
	})
	@ApiResponse({
		status: 200,
		description: "XLSX файл отчёта S2T",
	})
	async exportS2tReportByChangeId(
		@Param("changeId", ParseIntPipe) changeId: number,
		@Query("entityId") entityId: string,
		@Res() reply: FastifyReply,
	): Promise<void> {
		const { buffer, fileName, mimeType } =
			await this.s2tExportService.exportByChangeIdToXlsx({
				targetEntityId: entityId,
				changeId,
			});

		reply.header("Content-Type", mimeType);
		reply.header(
			"Content-Disposition",
			`attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
		);
		reply.send(buffer);
	}
}
