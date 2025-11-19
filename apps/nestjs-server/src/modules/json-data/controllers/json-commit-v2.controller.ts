import { Controller } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JsonCommitController } from "./json-commit.controller";

@ApiBearerAuth("JWT-auth")
@ApiTags("JSON Коммиты v2")
@Controller("v2/json-commits")
export class JsonCommitV2Controller extends JsonCommitController {}
