import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityContainerTable1760000000006
	implements MigrationInterface
{
	name = "CreateEntityContainerTable1760000000006";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS entity_container (
                entity_container_id      SERIAL PRIMARY KEY,
                change_id                INTEGER NOT NULL,
                entity_container_type_id INTEGER NOT NULL,
                parent_container_id      INTEGER,
                description              VARCHAR,
                value                    VARCHAR NOT NULL,
                system_id                INTEGER,
                CONSTRAINT fk_entity_container_change FOREIGN KEY (change_id) REFERENCES changes (change_id),
                CONSTRAINT fk_entity_container_type FOREIGN KEY (entity_container_type_id) REFERENCES entity_container_type (entity_container_type_id),
                CONSTRAINT fk_entity_container_parent FOREIGN KEY (parent_container_id) REFERENCES entity_container (entity_container_id),
                CONSTRAINT fk_entity_container_system FOREIGN KEY (system_id) REFERENCES systems (system_id),
                CONSTRAINT entity_container_id_unique UNIQUE (entity_container_id)
                )
        `);

		await queryRunner.query(`
            COMMENT ON TABLE entity_container IS 'Контейнер, верхнеуровневые сущности (модель, БД) .'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_container.entity_container_id IS 'Идентификатор записи'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_container.change_id IS 'Идентификатор изменения'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_container.entity_container_type_id IS 'Тип контейнера'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_container.parent_container_id IS 'Идентификатор родительского контейнера'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_container.description IS 'Описание БД'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_container.value IS 'Наименование БД'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_container.system_id IS 'Идентификатор системы'
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE entity_container`);
	}
}
