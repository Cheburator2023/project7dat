import { Injectable, Logger } from "@nestjs/common";
import { JsonSchemaVersionValidator } from "./interfaces/validation.interfaces";

@Injectable()
export class JsonSchemaVersionValidationService extends JsonSchemaVersionValidator {
	private readonly logger = new Logger(JsonSchemaVersionValidationService.name);
	private readonly supportedVersions = ["1.0", "1.1", "2.0"];

	validateSchemaVersion(data: any): {
		isValid: boolean;
		version: string;
		supported: boolean;
		message: string;
	} {
		const version = data.desc?.schemaVersion || "1.0";
		const isSupported = this.supportedVersions.includes(version);

		let message = "";
		if (!isSupported) {
			message = `Версия схемы ${version} не поддерживается. Поддерживаемые версии: ${this.supportedVersions.join(", ")}`;
		} else {
			message = `Версия схемы ${version} поддерживается`;
		}

		return {
			isValid: isSupported,
			version,
			supported: isSupported,
			message,
		};
	}
}
