import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveHashFromCommits1754565300000 implements MigrationInterface {
	name = "RemoveHashFromCommits1754565300000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Remove the unique constraint on hash column first
		await queryRunner.query(
			`ALTER TABLE "json_commits" DROP CONSTRAINT IF EXISTS "UQ_hash"`,
		);

		// Drop the hash column
		await queryRunner.query(
			`ALTER TABLE "json_commits" DROP COLUMN IF EXISTS "hash"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Add back the hash column
		await queryRunner.query(
			`ALTER TABLE "json_commits" ADD "hash" character varying(64)`,
		);

		// Add back the unique constraint (but this might fail if there are duplicates)
		await queryRunner.query(
			`ALTER TABLE "json_commits" ADD CONSTRAINT "UQ_hash" UNIQUE ("hash")`,
		);
	}
}
