import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityTable1760000000007 implements MigrationInterface {
	name = "CreateEntityTable1760000000007";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS entity (
                entity_id INTEGER PRIMARY KEY,
                change_id INTEGER NOT NULL,
                entity_type_id INTEGER NOT NULL,
                entity_container_id INTEGER,
                name VARCHAR NOT NULL,
                full_name VARCHAR NOT NULL,
                description VARCHAR,
                CONSTRAINT fk_entity_change FOREIGN KEY (change_id) REFERENCES changes(change_id),
                CONSTRAINT fk_entity_type FOREIGN KEY (entity_type_id) REFERENCES entity_type(entity_type_id),
                CONSTRAINT fk_entity_container FOREIGN KEY (entity_container_id) REFERENCES entity_container(entity_container_id),
                CONSTRAINT entity_full_name_unique UNIQUE (full_name)
                )
        `);

		await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_full_name ON entity(full_name)
        `);

		await queryRunner.query(`
            COMMENT ON TABLE entity IS 'Сущность (таблица, представление)'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity.entity_id IS 'Идентификатор записи'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity.change_id IS 'Идентификатор изменения'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity.entity_type_id IS 'Тип таблицы'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity.entity_container_id IS 'Идентификатор БД/Модели'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity.name IS 'Наименование витрины'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity.full_name IS 'Уникальное полное наименование витрины (схема + витрина)'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity.description IS 'Описание витрины'
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX idx_entity_full_name`);
		await queryRunner.query(`DROP TABLE entity`);
	}
}
