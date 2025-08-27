import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGroupTable1760000000014 implements MigrationInterface {
    name = 'CreateGroupTable1760000000014';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "group" (
                group_id INTEGER PRIMARY KEY,
                change_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                CONSTRAINT fk_group_change FOREIGN KEY (change_id) REFERENCES changes(change_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE "group" IS 'Справочник групп (подразделений)'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "group"`);
    }
}