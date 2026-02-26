import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOriginalPayloadToS2tCommits1760000000027
	implements MigrationInterface
{
	name = "AddOriginalPayloadToS2tCommits1760000000027";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE s2t_commits
			ADD COLUMN IF NOT EXISTS original_payload JSONB NULL
		`);

		await queryRunner.query(`
			UPDATE s2t_commits
			SET original_payload = payload
			WHERE original_payload IS NULL
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE s2t_commits
			DROP COLUMN IF EXISTS original_payload
		`);
	}
}
