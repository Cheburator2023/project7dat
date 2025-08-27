import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityContainerTypeTable1760000000004 implements MigrationInterface {
    name = 'CreateEntityContainerTypeTable1760000000004';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE entity_container_type (
                entity_container_type_id INTEGER PRIMARY KEY,
                change_id INTEGER NOT NULL,
                value VARCHAR NOT NULL,
                description VARCHAR,
                CONSTRAINT fk_entity_container_type_change FOREIGN KEY (change_id) REFERENCES changes(change_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE entity_container_type IS 'Справочник типов контейнеров'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_container_type.entity_container_type_id IS 'Идентификатор записи'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_container_type.change_id IS 'Идентификатор изменения'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_container_type.value IS 'Наименование типа'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_container_type.description IS 'Описание типа'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE entity_container_type`);
    }
}