import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JsonDataEntity } from "../entities/json-data.entity";
import { JsonDataService } from "../services/json-data.service";
import { JsonDataController } from "../controllers/json-data.controller";
import { PGLiteService } from "../shared/database/pglite.service";

const isDevelopment = process.env.NODE_ENV !== "production";

@Module({
	imports: [
		...(isDevelopment ? [] : [TypeOrmModule.forFeature([JsonDataEntity])]),
	],
	controllers: [JsonDataController],
	providers: [JsonDataService, PGLiteService],
	exports: [JsonDataService],
})
export class JsonDataModule {}
