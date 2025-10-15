import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProcessDescriptionColumn1760000000018 implements MigrationInterface {
    name = 'AddProcessDescriptionColumn1760000000018';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE process 
            ADD COLUMN IF NOT EXISTS description VARCHAR
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN process.description IS 'Описание процесса DAG'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE process 
            DROP COLUMN IF EXISTS description
        `);
    }
}