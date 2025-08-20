import { ApiProperty } from "@nestjs/swagger";
import { JsonCommitBaseDto } from "../base/json-commit-base.dto";

export class JsonCommitResponseDto extends JsonCommitBaseDto {
	@ApiProperty({
		description: "Уникальный идентификатор коммита",
		example: "uuid-string",
	})
	id: string;

	@ApiProperty({
		description: "Хэш коммита",
		example: "a1b2c3d4",
	})
	hash: string;

	@ApiProperty({
		description: "ID связанного графика",
		example: "uuid-string",
	})
	graphId: string;

	@ApiProperty({
		description: "Diff данные коммита",
		example: { _type: "initial", data: {} },
	})
	diff: Record<string, any>;

	@ApiProperty({
		description: "Полные данные на момент коммита",
		example: { entities: [], mappings: [] },
	})
	fullData: Record<string, any>;

	@ApiProperty({
		description: "Дата создания коммита",
		example: "2023-01-01T00:00:00.000Z",
	})
	createdAt: Date;
}
