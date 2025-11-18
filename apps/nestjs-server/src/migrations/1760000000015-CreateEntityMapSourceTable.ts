import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityMapSourceTable1760000000015 implements MigrationInterface {
	name = "CreateEntityMapSourceTable1760000000015";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS entity_map_source (
				entity_map_id INTEGER NOT NULL,
				source_entity_id INTEGER NOT NULL,
				change_id INTEGER NOT NULL,
				CONSTRAINT pk_entity_map_source PRIMARY KEY (entity_map_id, source_entity_id),
				CONSTRAINT fk_entity_map_source_change FOREIGN KEY (change_id) REFERENCES changes(change_id),
				CONSTRAINT fk_entity_map_source_entity FOREIGN KEY (source_entity_id) REFERENCES entity(entity_id),
				CONSTRAINT fk_entity_map_source_entity_map FOREIGN KEY (entity_map_id) REFERENCES entity_map(entity_map_id)
				)
		`);

		await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_entity_map_source_entity_map ON entity_map_source(entity_map_id)`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_entity_map_source_source_entity ON entity_map_source(source_entity_id)`);

		await queryRunner.query(`COMMENT ON TABLE entity_map_source IS 'Связь маппинга сущности с сущностями-источниками'`);
		await queryRunner.query(`COMMENT ON COLUMN entity_map_source.entity_map_id IS 'Идентификатор маппинга таблицы'`);
		await queryRunner.query(`COMMENT ON COLUMN entity_map_source.source_entity_id IS 'Идентификатор сущности-источника'`);
		await queryRunner.query(`COMMENT ON COLUMN entity_map_source.change_id IS 'Идентификатор изменения'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS entity_map_source`);
	}
}
