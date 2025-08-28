import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateEntityAttributeMapTable1760000000012 implements MigrationInterface {
    name = 'CreateEntityAttributeMapTable1760000000012';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE entity_attribute_map (
                entity_map_id       INTEGER NOT NULL,
                source_attribute_id INTEGER NOT NULL,
                deptype_id          VARCHAR NOT NULL,
                change_id           INTEGER NOT NULL,
                CONSTRAINT pk_entity_attribute_map PRIMARY KEY (entity_map_id, source_attribute_id, deptype_id),
                CONSTRAINT fk_entity_attribute_map_change FOREIGN KEY (change_id) REFERENCES changes (change_id),
                CONSTRAINT fk_entity_attribute_map_attribute FOREIGN KEY (source_attribute_id) REFERENCES attribute (attribute_id),
                CONSTRAINT fk_entity_attribute_map_entity_map FOREIGN KEY (entity_map_id) REFERENCES entity_map (entity_map_id)
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE entity_attribute_map IS 'Маппинг функциональных атрибутов источника (функции join, where, group by etc.)'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_attribute_map.entity_map_id IS 'Идентификатор общего маппинга в таблице attribute_map'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_attribute_map.source_attribute_id IS 'Идентификатор атрибута источника'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_attribute_map.deptype_id IS 'Идентификатор функции'
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN entity_attribute_map.change_id IS 'Идентификатор изменения'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE entity_attribute_map`);
    }
}