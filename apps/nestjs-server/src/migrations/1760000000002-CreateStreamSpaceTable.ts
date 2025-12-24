import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStreamSpaceTable1760000000002 implements MigrationInterface {
	name = "CreateStreamSpaceTable1760000000002";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS stream_space (
                id SERIAL PRIMARY KEY,
                name_space VARCHAR,
                stream_name VARCHAR,
                CONSTRAINT stream_space_id_unique UNIQUE (id)
            )
        `);

		await queryRunner.query(
			`COMMENT ON TABLE stream_space IS 'Справочник владельцев процессов.'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN stream_space.id IS 'Идентификатор записи'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN stream_space.name_space IS 'Наименование схемы (БД)'`,
		);
		await queryRunner.query(
			`COMMENT ON COLUMN stream_space.stream_name IS 'Наименование стрима - владельца схемы'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS stream_space`);
	}
}
