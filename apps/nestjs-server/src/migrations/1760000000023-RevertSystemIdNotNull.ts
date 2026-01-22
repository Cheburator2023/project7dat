import { MigrationInterface, QueryRunner } from "typeorm";

export class RevertSystemIdNotNull1760000000023 implements MigrationInterface {
	name = "RevertSystemIdNotNull1760000000023";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE entity_container 
            ALTER COLUMN system_id DROP NOT NULL,
            ALTER COLUMN system_id DROP DEFAULT
        `);

		await queryRunner.query(`
            UPDATE entity_container 
            SET system_id = NULL 
            WHERE system_id = 1
        `);

		await queryRunner.query(`
            DELETE FROM systems WHERE system_id = 1 AND code = 'default'
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
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
}
