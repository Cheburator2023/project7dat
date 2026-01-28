import { Injectable, Logger } from "@nestjs/common";
import { VersioningService } from "./versioning.service";

@Injectable()
export class JsonMigrationService {
	private readonly logger = new Logger(JsonMigrationService.name);

	constructor(private readonly versioningService: VersioningService) {}

	migrateDataToCurrentVersion(data: any, fromVersion: string): any {
		this.logger.log(`Миграция данных с версии ${fromVersion}`);
		return this.versioningService.migrateDataToCurrentVersion(
			data,
			fromVersion,
		);
	}

	validateVersionCompatibility(schemaVersion: string): any {
		return this.versioningService.validateVersionCompatibility(schemaVersion);
	}

	handleBackwardCompatibility(data: any, schemaVersion: string): any {
		return this.versioningService.handleBackwardCompatibility(
			data,
			schemaVersion,
		);
	}
}
