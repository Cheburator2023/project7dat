import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityMapTable1760000000012 implements MigrationInterface {
	name = "CreateEntityMapTable1760000000012";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS entity_map (
                entity_map_id INTEGER PRIMARY KEY,
                entity_id INTEGER NOT NULL,
                description VARCHAR,
                process_id INTEGER NOT NULL,
                change_id INTEGER NOT NULL,
                CONSTRAINT fk_entity_map_entity FOREIGN KEY (entity_id) REFERENCES entity(entity_id),
                CONSTRAINT fk_entity_map_process FOREIGN KEY (process_id) REFERENCES process(process_id),
                CONSTRAINT fk_entity_map_change FOREIGN KEY (change_id) REFERENCES changes(change_id)
            )
        `);

		await queryRunner.query(`
            COMMENT ON TABLE entity_map IS 'Общий маппинг таблицы. Связь сущности с процессом и маппингом'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_map.entity_map_id IS 'Идентификатор записи'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_map.entity_id IS 'Идентификатор таблицы'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_map.description IS 'Описание'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_map.process_id IS 'Идентификатор процесса'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN entity_map.change_id IS 'Идентификатор изменения'
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE entity_map`);
	}
}
