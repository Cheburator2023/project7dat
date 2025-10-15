import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelationChangeColumns1760000000021 implements MigrationInterface {
    name = 'AddRelationChangeColumns1760000000021';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE entity_map 
            ADD COLUMN IF NOT EXISTS relation_change VARCHAR
        `);

        await queryRunner.query(`
            ALTER TABLE attribute_map 
            ADD COLUMN IF NOT EXISTS relation_change VARCHAR
        `);

        await queryRunner.query(`
            ALTER TABLE entity_attribute_map 
            ADD COLUMN IF NOT EXISTS relation_change VARCHAR
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN entity_map.relation_change IS 'Дата добавления/изменения связи'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute_map.relation_change IS 'Дата добавления/изменения связи'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_attribute_map.relation_change IS 'Дата добавления/изменения связи'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE entity_map 
            DROP COLUMN IF EXISTS relation_change
        `);
        await queryRunner.query(`
            ALTER TABLE attribute_map 
            DROP COLUMN IF EXISTS relation_change
        `);
        await queryRunner.query(`
            ALTER TABLE entity_attribute_map 
            DROP COLUMN IF EXISTS relation_change
        `);
    }
}