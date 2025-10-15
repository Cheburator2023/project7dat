import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConstraintsAndIndexes1760000000023 implements MigrationInterface {
    name = 'AddConstraintsAndIndexes1760000000023';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE entity_attribute_map 
            ADD CONSTRAINT IF NOT EXISTS fk_entity_attribute_map_deptype 
            FOREIGN KEY (deptype_id) REFERENCES dependency_type(deptype_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_map_process_id ON entity_map(process_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_map_entity_id ON entity_map(entity_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_attribute_map_entity_map_id ON attribute_map(entity_map_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_attribute_map_attribute_id ON attribute_map(attribute_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_attribute_map_deptype ON entity_attribute_map(deptype_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_process_name ON process(name)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE entity_attribute_map 
            DROP CONSTRAINT IF EXISTS fk_entity_attribute_map_deptype
        `);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_map_process_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_map_entity_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_attribute_map_entity_map_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_attribute_map_attribute_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_attribute_map_deptype`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_process_name`);
    }
}