import { ApiProperty } from "@nestjs/swagger";

export class S2tConvertResponseDto {
	@ApiProperty({
		description: "Метаданные конвертации",
		example: {
			fileName: "prod_dm_dadm_pvr.pd_mb_behaviour_online.xlsx",
			generatedAt: "2026-01-21T20:09:07.416Z",
		},
	})
	meta: {
		fileName?: string;
		generatedAt: string;
	};

	@ApiProperty({
		description: "JSON-представление Excel workbook",
		type: Object,
	})
	workbook: Record<string, any>;
}
