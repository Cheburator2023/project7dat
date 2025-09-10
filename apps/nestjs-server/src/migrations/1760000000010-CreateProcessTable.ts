import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateProcessTable1760000000010 implements MigrationInterface {
    name = 'CreateProcessTable1760000000010';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS process (
                process_id   SERIAL PRIMARY KEY,
                change_id    INTEGER NOT NULL,
                process_type VARCHAR NOT NULL,
                name         VARCHAR NOT NULL,
                group_id     INTEGER,
                CONSTRAINT fk_process_change FOREIGN KEY (change_id) REFERENCES changes (change_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE process IS 'Процессы обновления витрин (DAG) и моделей'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN process.process_id IS 'Идентификатор записи'
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
            COMMENT ON COLUMN process.group_id IS 'Идентификатор группы (подразделение-владелец процесса)'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE process`);
    }
}