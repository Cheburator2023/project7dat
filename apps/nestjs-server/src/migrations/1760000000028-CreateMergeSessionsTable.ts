import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMergeSessionsTable1760000000028
	implements MigrationInterface
{
	name = "CreateMergeSessionsTable1760000000028";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS merge_sessions (
				id UUID PRIMARY KEY,
				commit_id UUID NOT NULL,
				commit_name VARCHAR(500) NOT NULL,
				had_existing_cycles BOOLEAN NOT NULL DEFAULT FALSE,
				merge_status VARCHAR(32) NOT NULL DEFAULT 'pending',
				progress INTEGER NOT NULL DEFAULT 0,
				stage VARCHAR(255) NOT NULL DEFAULT 'Ожидание подтверждения',
				started_at TIMESTAMP NULL,
				snapshot_id UUID NULL,
				error_message TEXT NULL,
				estimated_seconds_left INTEGER NULL,
				cancel_requested BOOLEAN NOT NULL DEFAULT FALSE,
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				CONSTRAINT fk_merge_sessions_commit_id
					FOREIGN KEY (commit_id)
					REFERENCES s2t_commits(id)
					ON DELETE CASCADE
			)
		`);

		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS idx_merge_sessions_commit_id ON merge_sessions(commit_id)`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS idx_merge_sessions_status ON merge_sessions(merge_status)`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS idx_merge_sessions_created_at ON merge_sessions(created_at)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS merge_sessions`);
	}
}
