import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateS2tCommitsTable1760000000022 implements MigrationInterface {
	name = "CreateS2tCommitsTable1760000000022";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS s2t_commits (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				parent_id UUID NULL,
				commit_name VARCHAR(500) NOT NULL,
				commit_description TEXT NULL,
				type VARCHAR(50) NOT NULL,
				state VARCHAR(50) NOT NULL,
				"user" VARCHAR(200) NULL,
				payload JSONB NOT NULL,
				change_id INTEGER NULL,
				error TEXT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				CONSTRAINT fk_s2t_commits_parent
					FOREIGN KEY (parent_id)
					REFERENCES s2t_commits(id)
					ON DELETE SET NULL
			)
		`);

		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS idx_s2t_commits_state ON s2t_commits(state)`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS idx_s2t_commits_type ON s2t_commits(type)`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS idx_s2t_commits_parent_id ON s2t_commits(parent_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS idx_s2t_commits_created_at ON s2t_commits(created_at)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS s2t_commits`);
	}
}
