import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JsonDataEntity } from "../entities/json-data.entity";
import { JsonDataService } from "../services/json-data.service";
import { JsonDataController } from "../controllers/json-data.controller";

@Module({
	imports: [TypeOrmModule.forFeature([JsonDataEntity])],
	controllers: [JsonDataController],
	providers: [JsonDataService],
	exports: [JsonDataService],
})
export class JsonDataModule {}
