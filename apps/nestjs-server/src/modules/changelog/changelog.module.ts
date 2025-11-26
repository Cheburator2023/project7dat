import { Module } from "@nestjs/common";
import { ChangelogController } from "./controllers/changelog.controller";
import { ChangelogService } from "./services/changelog.service";
import { ChangelogMemoryStorageService } from "./services/changelog-memory-storage.service";

@Module({
	controllers: [ChangelogController],
	providers: [ChangelogService, ChangelogMemoryStorageService],
	exports: [ChangelogService, ChangelogMemoryStorageService],
})
export class ChangelogModule {}
