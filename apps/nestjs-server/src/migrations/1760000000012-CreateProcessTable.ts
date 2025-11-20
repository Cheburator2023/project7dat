import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProcessTable1760000000012 implements MigrationInterface {
	name = "CreateProcessTable1760000000012";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS process (
				process_id   SERIAL PRIMARY KEY,
				change_id    INTEGER NOT NULL,
				process_type INTEGER NOT NULL,
				name         VARCHAR NOT NULL,
				group_id     INTEGER,
				description  VARCHAR,
				CONSTRAINT fk_process_change FOREIGN KEY (change_id) REFERENCES changes (change_id),
				CONSTRAINT fk_process_type FOREIGN KEY (process_type) REFERENCES process_type (process_type_id),
				CONSTRAINT fk_process_group FOREIGN KEY (group_id) REFERENCES process_group(group_id),
				CONSTRAINT process_id_unique UNIQUE (process_id),
				CONSTRAINT process_name_unique UNIQUE (name)
				)
		`);

		await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_process_name ON process(name)`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_process_change_id ON process(change_id)`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_process_type ON process(process_type)`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_process_group_id ON process(group_id)`);

		await queryRunner.query(`COMMENT ON TABLE process IS 'Процессы обновления витрин (DAG) и моделей'`);
		await queryRunner.query(`COMMENT ON COLUMN process.process_id IS 'Идентификатор записи'`);
		await queryRunner.query(`COMMENT ON COLUMN process.change_id IS 'Идентификатор изменения'`);
		await queryRunner.query(`COMMENT ON COLUMN process.process_type IS 'Тип процесса'`);
		await queryRunner.query(`COMMENT ON COLUMN process.name IS 'Наименование процесса'`);
		await queryRunner.query(`COMMENT ON COLUMN process.group_id IS 'Идентификатор группы (подразделение-владелец процесса)'`);
		await queryRunner.query(`COMMENT ON COLUMN process.description IS 'Описание процесса'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS process`);
	}
}