import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDependencyTypeTable1760000000017 implements MigrationInterface {
    name = 'CreateDependencyTypeTable1760000000017';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS dependency_type (
                deptype_id SERIAL PRIMARY KEY,
                change_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                CONSTRAINT fk_dependency_type_change FOREIGN KEY (change_id) REFERENCES changes(change_id),
                CONSTRAINT dependency_type_id_unique UNIQUE (deptype_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE dependency_type IS 'Справочник типов зависимостей (join, where, group by и т.д.)'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN dependency_type.deptype_id IS 'Идентификатор записи'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN dependency_type.change_id IS 'Идентификатор изменения'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN dependency_type.name IS 'Наименование типа зависимости'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN dependency_type.description IS 'Описание типа зависимости'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE dependency_type`);
    }
}