import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFailedMappingsTable1760000000019
	implements MigrationInterface
{
	name = "CreateFailedMappingsTable1760000000019";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS failed_mappings (
				failed_mapping_id SERIAL PRIMARY KEY,
				change_id INTEGER NOT NULL,
				entity_name VARCHAR NOT NULL,
				error_description TEXT,
				unmatched_entities TEXT,
				CONSTRAINT fk_failed_mappings_change FOREIGN KEY (change_id) REFERENCES changes(change_id),
				CONSTRAINT failed_mapping_id_unique UNIQUE (failed_mapping_id)
				)
		`);

		await queryRunner.query(
			`COMMENT ON TABLE failed_mappings IS 'Информация о маппингах, завершившихся с ошибкой'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN failed_mappings.failed_mapping_id IS 'Идентификатор записи'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN failed_mappings.change_id IS 'Идентификатор изменения'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN failed_mappings.entity_name IS 'Имя сущности с ошибкой'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN failed_mappings.error_description IS 'Описание ошибки'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN failed_mappings.unmatched_entities IS 'Сущности, которые не получилось сопоставить'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS failed_mappings`);
	}
}
