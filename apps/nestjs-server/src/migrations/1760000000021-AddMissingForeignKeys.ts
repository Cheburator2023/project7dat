import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingForeignKeys1760000000021 implements MigrationInterface {
	name = "AddMissingForeignKeys1760000000021";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE process 
            ADD CONSTRAINT fk_process_group 
            FOREIGN KEY (group_id) REFERENCES process_group(group_id)
        `);

		await queryRunner.query(`
            ALTER TABLE entity_attribute_map 
            ADD CONSTRAINT fk_entity_attribute_map_deptype 
            FOREIGN KEY (deptype_id) REFERENCES dependency_type(deptype_id)
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE process 
            DROP CONSTRAINT IF EXISTS fk_process_group
        `);

		await queryRunner.query(`
            ALTER TABLE entity_attribute_map 
            DROP CONSTRAINT IF EXISTS fk_entity_attribute_map_deptype
        `);
	}
}
