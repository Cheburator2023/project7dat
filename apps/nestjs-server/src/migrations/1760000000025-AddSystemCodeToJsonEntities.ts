import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSystemCodeToJsonEntities1760000000025 implements MigrationInterface {
    name = 'AddSystemCodeToJsonEntities1760000000025'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_system_id ON entity_container(system_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_systems_code ON systems(code)
        `);

        await queryRunner.query(`
            COMMENT ON TABLE systems IS 'Справочник систем. Поле code используется как system_code в JSON структурах'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN systems.code IS 'Код системы, используемый в качестве system_code в JSON. Должен быть уникальным'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_system_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_systems_code`);
    }
}