import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileNameToS2tCommits1760000000030
	implements MigrationInterface
{
	name = "AddFileNameToS2tCommits1760000000030";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE s2t_commits ADD COLUMN file_name VARCHAR(500) NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX idx_s2t_commits_file_name ON s2t_commits (file_name) WHERE file_name IS NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS idx_s2t_commits_file_name`);
		await queryRunner.query(
			`ALTER TABLE s2t_commits DROP COLUMN IF EXISTS file_name`,
		);
	}
}
