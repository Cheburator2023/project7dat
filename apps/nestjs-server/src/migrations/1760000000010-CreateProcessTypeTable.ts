import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProcessTypeTable1760000000010 implements MigrationInterface {
	name = "CreateProcessTypeTable1760000000010";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS process_type (
                process_type_id SERIAL PRIMARY KEY,
                change_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                CONSTRAINT fk_process_type_change FOREIGN KEY (change_id) REFERENCES changes(change_id),
                CONSTRAINT process_type_id_unique UNIQUE (process_type_id)
            )
        `);

		await queryRunner.query(`COMMENT ON TABLE process_type IS 'Справочник типов процессов'`);
		await queryRunner.query(`COMMENT ON COLUMN process_type.process_type_id IS 'Идентификатор записи'`);
		await queryRunner.query(`COMMENT ON COLUMN process_type.change_id IS 'Идентификатор изменения'`);
		await queryRunner.query(`COMMENT ON COLUMN process_type.name IS 'Наименование типа процесса'`);
		await queryRunner.query(`COMMENT ON COLUMN process_type.description IS 'Описание типа процесса'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS process_type`);
	}
}
