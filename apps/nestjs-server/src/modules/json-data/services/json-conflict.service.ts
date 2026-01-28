import { Injectable } from "@nestjs/common";
import { DependencyCheckService } from "./dependency-check.service";

@Injectable()
export class JsonConflictService {
	constructor(
		private readonly dependencyCheckService: DependencyCheckService,
	) {}

	async checkAffectedMarts(entities: any[]): Promise<{
		hasConflicts: boolean;
		conflicts: string[];
	}> {
		const conflicts: string[] = [];
		const modifiedEntities = entities.filter((entity) => entity.modified);

		if (modifiedEntities.length === 0) {
			return { hasConflicts: false, conflicts: [] };
		}

		for (const entity of modifiedEntities) {
			const usageCheck = await this.dependencyCheckService.checkMartUsage([
				entity.id,
			]);
			if (usageCheck.hasConflicts) {
				usageCheck.conflicts.forEach((conflict) => {
					conflicts.push(
						`Сущность ${conflict.entityName} используется в процессах: ${conflict.processes.join(", ")}`,
					);
				});
			}
		}

		return {
			hasConflicts: conflicts.length > 0,
			conflicts,
		};
	}

	async isSafeToUpdate(
		targetEntities: string[],
		sourceProcessId?: number,
	): Promise<{ safe: boolean; warnings: string[] }> {
		const warnings: string[] = [];

		const usageCheck = await this.dependencyCheckService.checkMartUsage(
			targetEntities,
			sourceProcessId,
		);

		if (usageCheck.hasConflicts) {
			for (const conflict of usageCheck.conflicts) {
				warnings.push(
					`Сущность "${conflict.entityName}" используется в процессах: ${conflict.processes.join(", ")}. ` +
						`Обновление может повлиять на эти процессы.`,
				);
			}
		}

		return {
			safe: warnings.length === 0,
			warnings,
		};
	}
}
