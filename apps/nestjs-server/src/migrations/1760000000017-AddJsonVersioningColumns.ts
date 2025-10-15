import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJsonVersioningColumns1760000000017 implements MigrationInterface {
    name = 'AddJsonVersioningColumns1760000000017';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE changes 
            ADD COLUMN IF NOT EXISTS schema_version VARCHAR,
            ADD COLUMN IF NOT EXISTS deprecation BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS user_id VARCHAR,
            ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN changes.schema_version IS 'Версия схемы JSON'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN changes.deprecation IS 'Признак устаревших данных (0 - актуально, 1 - архив)'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN changes.user_id IS 'Идентификатор пользователя'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN changes.timestamp IS 'Время отправки JSON'
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_changes_schema_version ON changes(schema_version)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_changes_deprecation ON changes(deprecation)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON changes(timestamp)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE changes 
            DROP COLUMN IF EXISTS schema_version,
            DROP COLUMN IF EXISTS deprecation,
            DROP COLUMN IF EXISTS user_id,
            DROP COLUMN IF EXISTS timestamp
        `);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_changes_schema_version`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_changes_deprecation`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_changes_timestamp`);
    }
}