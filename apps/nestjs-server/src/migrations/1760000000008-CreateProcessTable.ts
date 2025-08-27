import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateProcessTable1760000000008 implements MigrationInterface {
    name = 'CreateProcessTable1760000000008';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE process (
                process_id      INTEGER PRIMARY KEY,
                change_id       INTEGER NOT NULL,
                process_type_id INTEGER NOT NULL,
                name            VARCHAR NOT NULL,
                group_id        INTEGER,
                CONSTRAINT fk_process_change FOREIGN KEY (change_id) REFERENCES changes (change_id),
                CONSTRAINT fk_process_type FOREIGN KEY (process_type_id) REFERENCES process_type (process_type_id),
                CONSTRAINT fk_process_group FOREIGN KEY (group_id) REFERENCES "group" (group_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE process IS 'Процессы обновления витрин (DAG) и моделей'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN process.process_type_id IS 'Тип процесса (FK к process_type)'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN process.change_id IS 'Идентификатор изменения'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN process.process_type IS 'Тип процесса'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN process.name IS 'Наименование процесса'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN process.group_id IS 'Идентификатор группы (подразделение-владелец процесса, FK к group)'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE process`);
    }
}