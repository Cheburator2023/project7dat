import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChangesTable1760000000001 implements MigrationInterface {
	name = "CreateChangesTable1760000000001";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS changes (
                change_id   SERIAL PRIMARY KEY,
                change_date TIMESTAMP NOT NULL,
                change_user VARCHAR   NOT NULL,
                change_name VARCHAR   NOT NULL,
                app_id      VARCHAR,
                CONSTRAINT changes_change_id_unique UNIQUE (change_id)
            )
        `);

		await queryRunner.query(`
            COMMENT ON TABLE changes IS 'История изменений (инкрементов)'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN changes.change_id IS 'Идентификатор изменения'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN changes.change_date IS 'Дата и время изменения (коммита)'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN changes.change_user IS 'Пользователь'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN changes.change_name IS 'Наименование изменения'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN changes.app_id IS 'Уникальный идентификатор JSON от Автомаппера'
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE changes`);
	}
}
