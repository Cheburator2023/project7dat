import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProcessGroupTable1760000000016
	implements MigrationInterface
{
	name = "CreateProcessGroupTable1760000000016";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS process_group (
                group_id SERIAL PRIMARY KEY,
                change_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                CONSTRAINT fk_process_group_change FOREIGN KEY (change_id) REFERENCES changes(change_id),
                CONSTRAINT process_group_id_unique UNIQUE (group_id)
            )
        `);

		await queryRunner.query(`
            COMMENT ON TABLE process_group IS 'Группы процессов (подразделения-владельцы процессов)'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN process_group.group_id IS 'Идентификатор записи'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN process_group.change_id IS 'Идентификатор изменения'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN process_group.name IS 'Наименование группы'
        `);
		await queryRunner.query(`
            COMMENT ON COLUMN process_group.description IS 'Описание группы'
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE process_group`);
	}
}
