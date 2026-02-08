import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateJsonRefactoringViews1760000000026 implements MigrationInterface {
    name = 'CreateJsonRefactoringViews1760000000026';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Создаем VIEW для информации о системах сущностей
        await queryRunner.query(`
            CREATE OR REPLACE VIEW entity_system_view AS
            SELECT 
                e.entity_id,
                e.full_name,
                e.name AS entity_name,
                ec.value AS namespace,
                COALESCE(s.code, 
                    CASE 
                        WHEN e.entity_type_id = (SELECT entity_type_id FROM entity_type WHERE name = 'TABLE_HIVE') THEN '1642'
                        WHEN e.entity_type_id = (SELECT entity_type_id FROM entity_type WHERE name = 'VIEW_HIVE') THEN '1642'
                        WHEN e.entity_type_id IN (SELECT entity_type_id FROM entity_type WHERE name IN ('JSON', 'INPUT_VECTOR')) THEN '1655'
                        ELSE 'UNKNOWN'
                    END
                ) AS system_code,
                s.name AS system_name,
                s.system_id
            FROM entity e
            LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
            LEFT JOIN systems s ON ec.system_id = s.system_id;
        `);

        // 2. Создаем VIEW для расширенной информации о маппингах
        await queryRunner.query(`
            CREATE OR REPLACE VIEW entity_map_extended_view AS
            SELECT 
                em.entity_map_id,
                em.entity_id AS target_entity_id,
                em.description AS mapping_description,
                em.change_id AS relation_change_id,
                em.process_id,
                p.name AS process_name,
                p.description AS process_description,
                p.change_id AS process_change_id,
                ems.source_entity_id,
                c_rel.change_date AS relation_change_date,
                c_proc.change_date AS process_change_date
            FROM entity_map em
            LEFT JOIN entity_map_source ems ON em.entity_map_id = ems.entity_map_id
            LEFT JOIN process p ON em.process_id = p.process_id
            LEFT JOIN changes c_rel ON em.change_id = c_rel.change_id
            LEFT JOIN changes c_proc ON p.change_id = c_proc.change_id
            WHERE em.change_id IS NOT NULL;
        `);

        // 3. Создаем VIEW для маппинга атрибутов
        await queryRunner.query(`
            CREATE OR REPLACE VIEW attribute_mapping_extended_view AS
            SELECT 
                am.attribute_map_id,
                am.entity_map_id,
                am.attribute_id AS target_attribute_id,
                am.change_id AS attr_map_change_id,
                attr_target.name AS target_attribute_name,
                attr_target.entity_id AS target_entity_id,
                ams.source_attribute_id,
                attr_source.name AS source_attribute_name,
                attr_source.entity_id AS source_entity_id,
                c_attr.change_date AS attr_relation_change_date,
                at_target.name AS target_attribute_type,
                at_source.name AS source_attribute_type
            FROM attribute_map am
            JOIN attribute_map_source ams ON am.attribute_map_id = ams.attribute_map_id
            JOIN attribute attr_target ON am.attribute_id = attr_target.attribute_id
            JOIN attribute attr_source ON ams.source_attribute_id = attr_source.attribute_id
            LEFT JOIN changes c_attr ON am.change_id = c_attr.change_id
            LEFT JOIN attribute_type at_target ON attr_target.type_id = at_target.type_id
            LEFT JOIN attribute_type at_source ON attr_source.type_id = at_source.type_id;
        `);

        // 4. Создаем VIEW для зависимостей атрибутов
        await queryRunner.query(`
            CREATE OR REPLACE VIEW entity_attribute_dependency_view AS
            SELECT 
                eam.entity_map_id,
                eam.source_attribute_id,
                eam.deptype_id,
                a.name AS attribute_name,
                a.entity_id AS source_entity_id,
                dt.name AS dependency_type_name,
                dt.description AS dependency_description,
                c_dep.change_date AS dependency_change_date
            FROM entity_attribute_map eam
            JOIN attribute a ON eam.source_attribute_id = a.attribute_id
            JOIN dependency_type dt ON eam.deptype_id = dt.deptype_id
            LEFT JOIN changes c_dep ON eam.change_id = c_dep.change_id;
        `);

        // 5. Создаем VIEW для источников процессов (группировка по источникам)
        await queryRunner.query(`
            CREATE OR REPLACE VIEW entity_source_process_view AS
            SELECT 
                ems.entity_map_id,
                ems.source_entity_id,
                ARRAY_AGG(DISTINCT p.process_id) AS process_ids,
                ARRAY_AGG(DISTINCT p.name) AS process_names,
                ARRAY_AGG(DISTINCT p.description) AS process_descriptions,
                MAX(p.name) AS primary_process_name,
                MAX(p.description) AS primary_process_description,
                MAX(c_proc.change_date) AS primary_process_change_date
            FROM entity_map_source ems
            JOIN entity_map em ON ems.entity_map_id = em.entity_map_id
            LEFT JOIN process p ON em.process_id = p.process_id
            LEFT JOIN changes c_proc ON p.change_id = c_proc.change_id
            GROUP BY ems.entity_map_id, ems.source_entity_id;
        `);

        // 6. Создаем комплексное VIEW для формирования JSON в новой структуре
        await queryRunner.query(`
            CREATE OR REPLACE VIEW mapping_dependencies_view AS
            SELECT 
                em.entity_map_id,
                em.entity_id AS target_entity_id,
                target_e.full_name AS target_full_name,
                target_sys.system_code AS target_system_code,
                em.process_id,
                p.name AS process_name,
                p.description AS process_description,
                p.change_id AS process_change_id,
                c_proc.change_date AS process_change_date,
                ems.source_entity_id,
                source_e.full_name AS source_full_name,
                source_sys.system_code AS source_system_code,
                c_rel.change_date AS relation_change_date,
                em.change_id AS mapping_change_id
            FROM entity_map em
            JOIN entity target_e ON em.entity_id = target_e.entity_id
            LEFT JOIN entity_system_view target_sys ON target_e.entity_id = target_sys.entity_id
            JOIN entity_map_source ems ON em.entity_map_id = ems.entity_map_id
            JOIN entity source_e ON ems.source_entity_id = source_e.entity_id
            LEFT JOIN entity_system_view source_sys ON source_e.entity_id = source_sys.entity_id
            LEFT JOIN process p ON em.process_id = p.process_id
            LEFT JOIN changes c_rel ON em.change_id = c_rel.change_id
            LEFT JOIN changes c_proc ON p.change_id = c_proc.change_id
            WHERE em.change_id IS NOT NULL;
        `);

        // 7. Создаем VIEW для атрибутного маппинга с информацией о системе
        await queryRunner.query(`
            CREATE OR REPLACE VIEW attribute_mapping_view AS
            SELECT 
                am.attribute_map_id,
                am.entity_map_id,
                am.attribute_id AS target_attribute_id,
                a_target.name AS target_attribute_name,
                ams.source_attribute_id,
                a_source.name AS source_attribute_name,
                source_e.entity_id AS source_entity_id,
                source_sys.system_code AS source_system_code,
                c_attr.change_date AS relation_change_date
            FROM attribute_map am
            JOIN attribute_map_source ams ON am.attribute_map_id = ams.attribute_map_id
            JOIN attribute a_target ON am.attribute_id = a_target.attribute_id
            JOIN attribute a_source ON ams.source_attribute_id = a_source.attribute_id
            JOIN entity source_e ON a_source.entity_id = source_e.entity_id
            LEFT JOIN entity_system_view source_sys ON source_e.entity_id = source_sys.entity_id
            LEFT JOIN changes c_attr ON am.change_id = c_attr.change_id;
        `);

        // 8. Создаем VIEW для зависимостей атрибутов с информацией о системе
        await queryRunner.query(`
            CREATE OR REPLACE VIEW entity_attribute_mapping_view AS
            SELECT 
                eam.entity_map_id,
                eam.source_attribute_id,
                a.name AS source_attribute_name,
                eam.deptype_id,
                a.entity_id AS source_entity_id,
                source_sys.system_code AS source_system_code,
                c_dep.change_date AS relation_change_date
            FROM entity_attribute_map eam
            JOIN attribute a ON eam.source_attribute_id = a.attribute_id
            JOIN entity source_e ON a.entity_id = source_e.entity_id
            LEFT JOIN entity_system_view source_sys ON source_e.entity_id = source_sys.entity_id
            LEFT JOIN changes c_dep ON eam.change_id = c_dep.change_id;
        `);

        // 9. Создаем индексы для оптимизации VIEW
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_map_extended 
            ON entity_map(entity_map_id, entity_id, process_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_system 
            ON entity_container(system_id, entity_container_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_map_source_composite 
            ON entity_map_source(entity_map_id, source_entity_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_attribute_map_entity_map 
            ON attribute_map(entity_map_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Удаляем VIEW в обратном порядке
        await queryRunner.query(`DROP VIEW IF EXISTS entity_attribute_mapping_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS attribute_mapping_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS mapping_dependencies_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS entity_source_process_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS entity_attribute_dependency_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS attribute_mapping_extended_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS entity_map_extended_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS entity_system_view`);

        // Удаляем индексы
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_map_extended`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_system`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_map_source_composite`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_attribute_map_entity_map`);
    }
}