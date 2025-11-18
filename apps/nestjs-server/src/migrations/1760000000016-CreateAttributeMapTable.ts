import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAttributeMapTable1760000000016 implements MigrationInterface {
	name = "CreateAttributeMapTable1760000000016";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS attribute_map (
				attribute_map_id SERIAL PRIMARY KEY,
				entity_map_id INTEGER NOT NULL,
				attribute_id INTEGER NOT NULL,
				change_id INTEGER NOT NULL,
				CONSTRAINT fk_attribute_map_entity_map FOREIGN KEY (entity_map_id) REFERENCES entity_map(entity_map_id),
				CONSTRAINT fk_attribute_map_attribute FOREIGN KEY (attribute_id) REFERENCES attribute(attribute_id),
				CONSTRAINT fk_attribute_map_change FOREIGN KEY (change_id) REFERENCES changes(change_id),
				CONSTRAINT attribute_map_entity_attribute_unique UNIQUE (entity_map_id, attribute_id)
				)
		`);

		await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_attribute_map_entity_map ON attribute_map(entity_map_id)`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_attribute_map_attribute ON attribute_map(attribute_id)`);

		await queryRunner.query(`COMMENT ON TABLE attribute_map IS 'Общий маппинг атрибута (связка атрибут - его маппинг)'`);
		await queryRunner.query(`COMMENT ON COLUMN attribute_map.attribute_map_id IS 'Идентификатор записи'`);
		await queryRunner.query(`COMMENT ON COLUMN attribute_map.entity_map_id IS 'Идентификатор маппинга таблицы'`);
		await queryRunner.query(`COMMENT ON COLUMN attribute_map.attribute_id IS 'Идентификатор атрибута'`);
		await queryRunner.query(`COMMENT ON COLUMN attribute_map.change_id IS 'Идентификатор изменения'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS attribute_map`);
	}
}
