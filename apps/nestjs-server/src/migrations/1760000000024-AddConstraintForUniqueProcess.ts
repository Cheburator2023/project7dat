import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConstraintForUniqueProcess1760000000024 implements MigrationInterface {
    name = 'AddConstraintForUniqueProcess1760000000024';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE process 
            ADD CONSTRAINT process_name_unique UNIQUE (name)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE process 
            DROP CONSTRAINT IF EXISTS process_name_unique
        `);
    }
}