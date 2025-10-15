import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDependencyTypeTable1760000000022 implements MigrationInterface {
    name = 'CreateDependencyTypeTable1760000000022';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS dependency_type (
                deptype_id VARCHAR PRIMARY KEY,
                change_id INTEGER NOT NULL,
                description VARCHAR,
                CONSTRAINT fk_dependency_type_change FOREIGN KEY (change_id) REFERENCES changes(change_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE dependency_type IS 'Справочник типов зависимостей (функций)'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN dependency_type.deptype_id IS 'Идентификатор типа зависимости'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN dependency_type.change_id IS 'Идентификатор изменения'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN dependency_type.description IS 'Описание типа зависимости'
        `);

        await queryRunner.query(`
            INSERT INTO dependency_type (deptype_id, change_id, description) VALUES
            ('JOIN', 1, 'Используется в JOIN'),
            ('WHERE', 1, 'Используется в WHERE'),
            ('GROUP_BY', 1, 'Используется в GROUP BY'),
            ('ORDER_BY', 1, 'Используется в ORDER BY'),
            ('SELECT', 1, 'Используется в SELECT')
            ON CONFLICT (deptype_id) DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE dependency_type`);
    }
}