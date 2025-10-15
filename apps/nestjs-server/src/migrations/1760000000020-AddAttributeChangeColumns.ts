import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttributeChangeColumns1760000000020 implements MigrationInterface {
    name = 'AddAttributeChangeColumns1760000000020';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE attribute 
            ADD COLUMN IF NOT EXISTS attr_change VARCHAR
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN attribute.attr_change IS 'Дата изменения признака'
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_attribute_name ON attribute(name)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_attribute_type_id ON attribute(type_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE attribute 
            DROP COLUMN IF EXISTS attr_change
        `);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_attribute_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_attribute_type_id`);
    }
}