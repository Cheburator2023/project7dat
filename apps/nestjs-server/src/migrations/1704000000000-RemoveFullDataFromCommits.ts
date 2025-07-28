import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveFullDataFromCommits1704000000000
	implements MigrationInterface
{
	name = "RemoveFullDataFromCommits1704000000000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "json_commits" DROP COLUMN "fullData"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "json_commits" ADD "fullData" jsonb NOT NULL DEFAULT '{}'`,
		);
	}
}
