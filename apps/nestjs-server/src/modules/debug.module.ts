import { Module } from "@nestjs/common";
import { DebugController } from "../controllers/debug.controller";
import { DebugService } from "../services/debug.service";
import { JsonDataModule } from "./json-data.module";

@Module({
	imports: [JsonDataModule],
	controllers: [DebugController],
	providers: [DebugService],
	exports: [DebugService],
})
export class DebugModule {}
