import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityTypeTable1760000000004 implements MigrationInterface {
	name = "CreateEntityTypeTable1760000000004";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS entity_type (
                entity_type_id SERIAL PRIMARY KEY,
                change_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                CONSTRAINT fk_entity_type_change FOREIGN KEY (change_id) REFERENCES changes(change_id),
                CONSTRAINT entity_type_id_unique UNIQUE (entity_type_id)
                )
        `);

		await queryRunner.query(`
            COMMENT ON TABLE entity_type IS 'Справочник типов сущностей (таблица, view и т.д.)'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_type.entity_type_id IS 'Идентификатор записи'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_type.change_id IS 'Идентификатор изменения'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_type.name IS 'Наименование типа'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_type.description IS 'Описание типа'
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE entity_type`);
	}
}
