import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityTypeTable1760000000015 implements MigrationInterface {
    name = 'CreateEntityTypeTable1760000000015';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS entity_type (
                entity_type_id SERIAL PRIMARY KEY,
                change_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                CONSTRAINT fk_entity_type_change FOREIGN KEY (change_id) REFERENCES changes(change_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE entity_type IS 'Справочник типов сущностей'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_type.entity_type_id IS 'Идентификатор типа сущности'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_type.change_id IS 'Идентификатор изменения'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_type.name IS 'Наименование типа сущности'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_type.description IS 'Описание типа сущности'
        `);

        await queryRunner.query(`
            INSERT INTO entity_type (entity_type_id, change_id, name, description) VALUES
            (1, 1, 'TABLE_HIVE', 'Таблица Hive'),
            (2, 1, 'VIEW_HIVE', 'Представление Hive'),
            (3, 1, 'JSON', 'JSON файл'),
            (4, 1, 'INPUT_VECTOR', 'Входной вектор')
            ON CONFLICT (entity_type_id) DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE entity_type`);
    }
}