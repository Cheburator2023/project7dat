import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChangesToJsonCommits1760000000022
	implements MigrationInterface
{
	name = "AddChangesToJsonCommits1760000000022";

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Добавляем колонку changes для хранения структурированных изменений коммита
		await queryRunner.query(`
			ALTER TABLE "json_commits" 
			ADD COLUMN IF NOT EXISTS "changes" jsonb DEFAULT NULL
		`);

		// Добавляем комментарий к колонке
		await queryRunner.query(`
			COMMENT ON COLUMN "json_commits"."changes" IS 
			'Структурированные изменения коммита: entities (added/removed/modified), mappings (added/removed/modified), summary'
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "json_commits" 
			DROP COLUMN IF EXISTS "changes"
		`);
	}
}
