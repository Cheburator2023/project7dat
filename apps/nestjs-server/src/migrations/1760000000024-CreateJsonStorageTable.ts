import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateJsonStorageTable1760000000024 implements MigrationInterface {
    name = 'CreateJsonStorageTable1760000000024';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS json_storage (
                storage_id SERIAL PRIMARY KEY,
                change_id INTEGER NOT NULL,
                original_json JSONB NOT NULL,
                schema_version VARCHAR NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_json_storage_change FOREIGN KEY (change_id) REFERENCES changes(change_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE json_storage IS 'Хранение JSON в исходном виде'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN json_storage.storage_id IS 'Идентификатор записи'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN json_storage.change_id IS 'Идентификатор изменения'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN json_storage.original_json IS 'Исходный JSON'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN json_storage.schema_version IS 'Версия схемы JSON'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN json_storage.created_at IS 'Время создания записи'
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_json_storage_change_id ON json_storage(change_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_json_storage_schema_version ON json_storage(schema_version)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_json_storage_created_at ON json_storage(created_at)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE json_storage`);
    }
}