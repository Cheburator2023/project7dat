import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateAttributeTable1760000000009 implements MigrationInterface {
    name = 'CreateAttributeTable1760000000009';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE attribute (
                attribute_id SERIAL PRIMARY KEY,
                change_id    INTEGER NOT NULL,
                type_id      INTEGER NOT NULL,
                name         VARCHAR NOT NULL,
                entity_id    INTEGER NOT NULL,
                description  VARCHAR,
                CONSTRAINT fk_attribute_change FOREIGN KEY (change_id) REFERENCES changes (change_id),
                CONSTRAINT fk_attribute_type FOREIGN KEY (type_id) REFERENCES attribute_type (type_id),
                CONSTRAINT fk_attribute_entity FOREIGN KEY (entity_id) REFERENCES entity (entity_id),
                CONSTRAINT attribute_entity_id_name_unique UNIQUE (entity_id, name)
            )
        `);

        await queryRunner.query(`
            CREATE INDEX idx_attribute_entity_id_name ON attribute (entity_id, name)
        `);

        await queryRunner.query(`
            COMMENT ON TABLE attribute IS 'Атрибуты таблиц'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute.attribute_id IS 'Идентификатор записи'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute.change_id IS 'Идентификатор изменения'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute.type_id IS 'Тип атрибута'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute.name IS 'Наименование атрибута'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute.entity_id IS 'Идентификатор таблицы'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute.description IS 'Описание атрибута'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX idx_attribute_entity_id_name`);
        await queryRunner.query(`DROP TABLE attribute`);
    }
}