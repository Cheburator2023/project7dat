import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdditionalIndexes1760000000021 implements MigrationInterface {
    name = "AddAdditionalIndexes1760000000021";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_map_process_entity 
            ON entity_map(process_id, entity_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_attribute_map_source_attribute 
            ON attribute_map_source(source_attribute_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_attribute_map_deptype 
            ON entity_attribute_map(deptype_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_failed_mappings_entity_name 
            ON failed_mappings(entity_name)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_changes_user_date 
            ON changes(change_user, change_date)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_map_process_entity`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_attribute_map_source_attribute`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_attribute_map_deptype`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_failed_mappings_entity_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_changes_user_date`);
    }
}