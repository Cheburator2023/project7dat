import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsBoolean } from "class-validator";

export class VersionInfoDto {
	@ApiProperty({
		description: "Версия схемы JSON",
		example: "1.0.0",
	})
	@IsString()
	version: string;

	@ApiProperty({
		description: "Флаг устаревания данных",
		example: false,
	})
	@IsBoolean()
	deprecated: boolean;
}
