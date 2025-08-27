import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProcessTypeTable1760000000013 implements MigrationInterface {
    name = 'CreateProcessTypeTable1760000000013';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE process_type (
                process_type_id INTEGER PRIMARY KEY,
                change_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                CONSTRAINT fk_process_type_change FOREIGN KEY (change_id) REFERENCES changes(change_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE process_type IS 'Справочник типов процессов'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE process_type`);
    }
}