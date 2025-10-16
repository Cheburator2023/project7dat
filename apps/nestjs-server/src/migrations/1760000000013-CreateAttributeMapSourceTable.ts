import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateAttributeMapSourceTable1760000000013 implements MigrationInterface {
    name = 'CreateAttributeMapSourceTable1760000000013';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS attribute_map_source (
                attribute_map_id    INTEGER NOT NULL,
                source_attribute_id INTEGER NOT NULL,
                change_id           INTEGER NOT NULL,
                CONSTRAINT pk_attribute_map_source PRIMARY KEY (attribute_map_id, source_attribute_id),
                CONSTRAINT fk_attribute_map_source_change FOREIGN KEY (change_id) REFERENCES changes (change_id),
                CONSTRAINT fk_attribute_map_source_attribute FOREIGN KEY (source_attribute_id) REFERENCES attribute (attribute_id),
                CONSTRAINT fk_attribute_map_source_attribute_map FOREIGN KEY (attribute_map_id) REFERENCES attribute_map (attribute_map_id)
            )
        `);
        await queryRunner.query(`
            COMMENT ON TABLE attribute_map_source IS 'Маппинг атрибута источника (источник + идентификатор его маппинга на target)'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute_map_source.attribute_map_id IS 'Идентификатор общего маппинга атрибута'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute_map_source.source_attribute_id IS 'Идентификатор атрибута источника'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN attribute_map_source.change_id IS 'Идентификатор изменения'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE attribute_map_source`);
    }
}