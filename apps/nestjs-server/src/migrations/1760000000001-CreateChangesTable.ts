import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChangesTable1760000000001 implements MigrationInterface {
	name = "CreateChangesTable1760000000001";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS changes (
				change_id      SERIAL PRIMARY KEY,
				change_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				change_user    VARCHAR,
				change_name    VARCHAR,
				app_id         VARCHAR,
				schema_version VARCHAR DEFAULT '1.0',
				deprecation    BOOLEAN DEFAULT FALSE,
				user_id        VARCHAR,
				raw_json       TEXT,
				CONSTRAINT changes_change_id_unique UNIQUE (change_id)
			)
		`);

		await queryRunner.query(`
			CREATE INDEX IF NOT EXISTS idx_changes_schema_version ON changes(schema_version)
		`);
		await queryRunner.query(`
			CREATE INDEX IF NOT EXISTS idx_changes_deprecation ON changes(deprecation)
		`);
		await queryRunner.query(`
			CREATE INDEX IF NOT EXISTS idx_changes_change_date ON changes(change_date)
		`);
		await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_changes_app_id ON changes(app_id)
        `);

		await queryRunner.query(
			`COMMENT ON TABLE changes IS 'История изменений (инкрементов)'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN changes.change_id IS 'Идентификатор изменения'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN changes.change_date IS 'Дата и время изменения (коммита)'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN changes.change_user IS 'Пользователь'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN changes.change_name IS 'Наименование изменения'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN changes.app_id IS 'Уникальный идентификатор JSON от Автомаппера'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN changes.schema_version IS 'Версия схемы JSON'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN changes.deprecation IS 'Флаг устаревших данных (0/1)'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN changes.user_id IS 'Идентификатор пользователя'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN changes.raw_json IS 'Исходный JSON в текстовом формате'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS changes`);
	}
}
