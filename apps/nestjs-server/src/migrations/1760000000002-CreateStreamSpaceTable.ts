import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStreamSpaceTable1760000000002 implements MigrationInterface {
	name = "CreateStreamSpaceTable1760000000002";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS stream_space (
                id SERIAL PRIMARY KEY,
                name_space VARCHAR NOT NULL,
                stream_name VARCHAR NOT NULL
            )
        `);

		await queryRunner.query(`
            COMMENT ON TABLE stream_space IS 'Справочник владельцев процессов'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN stream_space.id IS 'Идентификатор записи'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN stream_space.name_space IS 'Наименование схемы'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN stream_space.stream_name IS 'Наименование стрима - владельца процесса'
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE stream_space`);
	}
}
