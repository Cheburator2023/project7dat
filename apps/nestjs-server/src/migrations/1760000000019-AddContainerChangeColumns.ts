import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContainerChangeColumns1760000000019 implements MigrationInterface {
    name = 'AddContainerChangeColumns1760000000019';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE entity_container 
            ADD COLUMN IF NOT EXISTS container_description VARCHAR,
            ADD COLUMN IF NOT EXISTS container_change VARCHAR
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN entity_container.container_description IS 'Описание контейнера (БД/модели)'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_container.container_change IS 'Дата и время изменения контейнера'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE entity_container 
            DROP COLUMN IF EXISTS container_description,
            DROP COLUMN IF EXISTS container_change
        `);
    }
}