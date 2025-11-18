import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSystemsTable1760000000003 implements MigrationInterface {
	name = "CreateSystemsTable1760000000003";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS systems (
                system_id SERIAL PRIMARY KEY,
                code      VARCHAR NOT NULL,
                name      VARCHAR NOT NULL
            )
        `);

		await queryRunner.query(`COMMENT ON TABLE systems IS 'Справочник систем'`);
		await queryRunner.query(`COMMENT ON COLUMN systems.system_id IS 'Идентификатор записи'`);
		await queryRunner.query(`COMMENT ON COLUMN systems.code IS 'Код системы'`);
		await queryRunner.query(`COMMENT ON COLUMN systems.name IS 'Наименование системы'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS systems`);
	}
}
