import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/core/shared/database/database.module";
import { DatabaseSchemaController } from "./controllers/database-schema.controller";
import { DatabaseSchemaService } from "./services/database-schema.service";

@Module({
	imports: [DatabaseModule.forRoot()],
	controllers: [DatabaseSchemaController],
	providers: [DatabaseSchemaService],
	exports: [DatabaseSchemaService],
})
export class DatabaseSchemaModule {}
