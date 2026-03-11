import { MigrationInterface, QueryRunner } from "typeorm";

export class DropHeavyJsonColumnsFromMergeSessions1760000000029
	implements MigrationInterface
{
	name = "DropHeavyJsonColumnsFromMergeSessions1760000000029";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE merge_sessions DROP COLUMN IF EXISTS original_json`,
		);
		await queryRunner.query(
			`ALTER TABLE merge_sessions DROP COLUMN IF EXISTS merged_json`,
		);
		await queryRunner.query(
			`ALTER TABLE merge_sessions DROP COLUMN IF EXISTS diff`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE merge_sessions ADD COLUMN original_json JSONB NOT NULL DEFAULT '{}'::jsonb`,
		);
		await queryRunner.query(
			`ALTER TABLE merge_sessions ADD COLUMN merged_json JSONB NOT NULL DEFAULT '{}'::jsonb`,
		);
		await queryRunner.query(
			`ALTER TABLE merge_sessions ADD COLUMN diff JSONB NOT NULL DEFAULT '[]'::jsonb`,
		);
	}
}
