import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexesForPerformance1760000000023 implements MigrationInterface {
    name = 'AddIndexesForPerformance1760000000023';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_name ON entity(name)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_process_name ON process(name)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_change_id ON entity(change_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_attribute_change_id ON attribute(change_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_process_change_id ON process(change_id)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_map_change_id ON entity_map(change_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_changes_schema_version ON changes(schema_version)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_changes_deprecation ON changes(deprecation)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_process_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_change_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_attribute_change_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_process_change_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_map_change_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_changes_schema_version`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_changes_deprecation`);
    }
}