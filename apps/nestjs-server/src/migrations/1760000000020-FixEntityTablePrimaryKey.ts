import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityTablePrimaryKey1760000000020
	implements MigrationInterface
{
	name = "FixEntityTablePrimaryKey1760000000020";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS entity_entity_id_seq;
        `);

		await queryRunner.query(`
            UPDATE entity SET entity_id = nextval('entity_entity_id_seq') 
            WHERE entity_id IS NULL OR entity_id = 0
        `);

		await queryRunner.query(`
            ALTER TABLE entity 
            ALTER COLUMN entity_id SET DEFAULT nextval('entity_entity_id_seq'),
            ALTER COLUMN entity_id SET NOT NULL
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE entity 
            ALTER COLUMN entity_id DROP DEFAULT,
            ALTER COLUMN entity_id DROP NOT NULL
        `);

		await queryRunner.query(`DROP SEQUENCE IF EXISTS entity_entity_id_seq`);
	}
}
