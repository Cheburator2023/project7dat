import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJsonVersioningColumns1760000000019
	implements MigrationInterface
{
	name = "AddJsonVersioningColumns1760000000019";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE changes 
            ADD COLUMN IF NOT EXISTS schema_version VARCHAR DEFAULT '1.0',
            ADD COLUMN IF NOT EXISTS deprecation BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS user_id VARCHAR,
            ADD COLUMN IF NOT EXISTS raw_json TEXT
        `);

		await queryRunner.query(`
            COMMENT ON COLUMN changes.schema_version IS 'Версия схемы JSON'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN changes.deprecation IS 'Флаг устаревших данных (0/1)'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN changes.user_id IS 'Идентификатор пользователя'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN changes.raw_json IS 'Исходный JSON в текстовом формате'
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE changes 
            DROP COLUMN IF EXISTS schema_version,
            DROP COLUMN IF EXISTS deprecation,
            DROP COLUMN IF EXISTS user_id,
            DROP COLUMN IF EXISTS raw_json
        `);
	}
}
