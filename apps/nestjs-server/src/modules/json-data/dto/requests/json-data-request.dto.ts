import { ApiProperty } from "@nestjs/swagger";
import { JsonDataBaseDto } from "../base/json-data-base.dto";

export class JsonDataRequestDto extends JsonDataBaseDto {
	@ApiProperty({
		description: "ID документа для обновления",
		example: "uuid-string",
		required: false,
	})
	id?: string;
}
