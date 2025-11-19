import { Controller } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JsonDataController } from "./json-data.controller";

@ApiBearerAuth("JWT-auth")
@ApiTags("JSON Данные v2")
@Controller("v2/json-data")
export class JsonDataV2Controller extends JsonDataController {}
