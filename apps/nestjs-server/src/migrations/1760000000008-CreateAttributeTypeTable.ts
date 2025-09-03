import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateAttributeTypeTable1760000000008 implements MigrationInterface {
    name = 'CreateAttributeTypeTable1760000000008';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE attribute_type (
                type_id     SERIAL PRIMARY KEY,
                change_id   INTEGER NOT NULL,
                name        VARCHAR NOT NULL,
                description VARCHAR,
                type_group  VARCHAR NOT NULL,
                CONSTRAINT fk_attribute_type_change FOREIGN KEY (change_id) REFERENCES changes (change_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE attribute_type IS 'Справочник типов данных по группам (таблицы, файлы, модели)'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute_type.type_id IS 'Идентификатор записи'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute_type.change_id IS 'Идентификатор изменения'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute_type.name IS 'Наименование типа'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute_type.description IS 'Описание типа'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute_type.type_group IS 'Наименование группы'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE attribute_type`);
    }
}