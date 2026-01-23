import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSystemIdDefaultAndDefaultSystem1760000000022
	implements MigrationInterface
{
	name = "AddSystemIdDefaultAndDefaultSystem1760000000022";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            INSERT INTO systems (system_id, code, name) 
            VALUES (1, 'default', 'Default System')
            ON CONFLICT (system_id) DO NOTHING
        `);

		await queryRunner.query(`
            UPDATE entity_container 
            SET system_id = 1 
            WHERE system_id IS NULL
        `);

		await queryRunner.query(`
            ALTER TABLE entity_container 
            ALTER COLUMN system_id SET NOT NULL,
            ALTER COLUMN system_id SET DEFAULT 1
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE entity_container 
            ALTER COLUMN system_id DROP NOT NULL,
            ALTER COLUMN system_id DROP DEFAULT
        `);

		await queryRunner.query(`
            DELETE FROM systems WHERE system_id = 1
        `);
	}
}
