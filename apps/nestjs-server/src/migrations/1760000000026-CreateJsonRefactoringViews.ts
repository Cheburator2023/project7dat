import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateJsonRefactoringViews1760000000026 implements MigrationInterface {
    name = 'CreateJsonRefactoringViews1760000000026';

    public async up(queryRunner: QueryRunner): Promise<void> {

        // 1. Создаем VIEW для системы сущностей
        await queryRunner.query(`
            CREATE OR REPLACE VIEW entity_system_enhanced_view AS
            SELECT
                e.entity_id,
                e.full_name,
                e.name AS entity_name,
                e.description,
                ec.value AS namespace,
            
                -- Правильный system_code из systems или из namespace, или дефолтный
                CASE
                    WHEN s.code IS NOT NULL THEN s.code
                    WHEN ec.value LIKE '%1642%' OR e.full_name LIKE '%1642%' THEN '1642'
                    WHEN ec.value LIKE '%1655%' OR e.full_name LIKE '%1655%' THEN '1655'
                    WHEN e.entity_type_id IN (
                        SELECT entity_type_id FROM entity_type WHERE name IN ('TABLE_HIVE', 'VIEW_HIVE')
                    ) THEN '1642'
                    WHEN e.entity_type_id IN (
                        SELECT entity_type_id FROM entity_type WHERE name IN ('JSON', 'INPUT_VECTOR')
                    ) THEN '1655'
                    ELSE '1642'
                END AS system_code,
            
                s.name AS system_name,
                s.system_id,
                e.entity_type_id,
                et.name AS entity_type_name
            FROM entity e
            LEFT JOIN entity_container ec ON e.entity_container_id = ec.entity_container_id
            LEFT JOIN systems s ON ec.system_id = s.system_id
            LEFT JOIN entity_type et ON e.entity_type_id = et.entity_type_id;
        `);

        // 2. VIEW для маппингов
        await queryRunner.query(`
            CREATE OR REPLACE VIEW entity_mapping_enhanced_view AS
            SELECT 
                em.entity_map_id,
                em.entity_id AS target_entity_id,
                target_e.full_name AS target_entity_full_name,
                target_e.name AS target_entity_name,
                
                -- Информация о target системе
                target_sys.system_code AS target_system_code,
                target_sys.namespace AS target_namespace,
                
                -- Информация о процессе (DAG)
                em.process_id,
                p.name AS process_name,
                p.description AS process_description,
                p.change_id AS process_change_id,
                
                -- Даты изменений
                em.change_id AS mapping_change_id,
                c_rel.change_date AS relation_change_date,
                c_proc.change_date AS process_change_date,
                
                -- Информация о неудачных маппингах
                fm.unmatched_entities AS failed_unmatched
            FROM entity_map em
            INNER JOIN entity target_e ON em.entity_id = target_e.entity_id
            LEFT JOIN entity_system_enhanced_view target_sys ON target_e.entity_id = target_sys.entity_id
            LEFT JOIN process p ON em.process_id = p.process_id
            LEFT JOIN changes c_rel ON em.change_id = c_rel.change_id
            LEFT JOIN changes c_proc ON p.change_id = c_proc.change_id
            LEFT JOIN failed_mappings fm ON em.entity_id = (
                SELECT entity_id FROM entity WHERE full_name = fm.entity_name LIMIT 1
            ) AND fm.change_id = em.change_id
            WHERE em.change_id IS NOT NULL;
        `);

        // 3. VIEW для источников с полной информацией
        await queryRunner.query(`
            CREATE OR REPLACE VIEW mapping_sources_enhanced_view AS
            SELECT DISTINCT
                ems.entity_map_id,
                ems.source_entity_id,
                source_e.full_name AS source_entity_full_name,
                source_e.name AS source_entity_name,
            
                -- Информация о source системе
                source_sys.system_code AS source_system_code,
                source_sys.namespace AS source_namespace,
            
                -- Связанный процесс (может быть разным для разных источников)
                em.process_id,
                p.name AS source_process_name,
                p.description AS source_process_description,
                p.change_id AS source_process_change_id,
            
                -- Даты изменений для источника
                ems.change_id AS source_relation_change_id,
                c_src.change_date AS source_relation_change_date,
                c_proc.change_date AS source_process_change_date
            FROM entity_map_source ems
            INNER JOIN entity source_e ON ems.source_entity_id = source_e.entity_id
            LEFT JOIN entity_system_enhanced_view source_sys ON source_e.entity_id = source_sys.entity_id
            INNER JOIN entity_map em ON ems.entity_map_id = em.entity_map_id
            LEFT JOIN process p ON em.process_id = p.process_id
            LEFT JOIN changes c_src ON ems.change_id = c_src.change_id
            LEFT JOIN changes c_proc ON p.change_id = c_proc.change_id
            WHERE ems.change_id IS NOT NULL;
        `);

        // 4. VIEW для атрибутных маппингов с информацией о системах
        await queryRunner.query(`
            CREATE OR REPLACE VIEW attribute_mapping_enhanced_view AS
            SELECT 
                am.attribute_map_id,
                am.entity_map_id,
                am.attribute_id AS target_attribute_id,
                a_target.name AS target_attribute_name,
                
                -- Информация о target атрибуте
                target_e.entity_id AS target_entity_id,
                target_e.full_name AS target_entity_full_name,
                target_sys.system_code AS target_system_code,
                
                -- Информация о source атрибуте
                ams.source_attribute_id,
                a_source.name AS source_attribute_name,
                source_e.entity_id AS source_entity_id,
                source_e.full_name AS source_entity_full_name,
                source_sys.system_code AS source_system_code,
                
                -- Дата изменения связи атрибутов
                am.change_id AS attr_map_change_id,
                c_attr.change_date AS attr_relation_change_date,
                
                -- Типы атрибутов
                at_target.name AS target_attribute_type,
                at_source.name AS source_attribute_type
            FROM attribute_map am
            INNER JOIN attribute_map_source ams ON am.attribute_map_id = ams.attribute_map_id
            INNER JOIN attribute a_target ON am.attribute_id = a_target.attribute_id
            INNER JOIN attribute a_source ON ams.source_attribute_id = a_source.attribute_id
            INNER JOIN entity target_e ON a_target.entity_id = target_e.entity_id
            INNER JOIN entity source_e ON a_source.entity_id = source_e.entity_id
            LEFT JOIN entity_system_enhanced_view target_sys ON target_e.entity_id = target_sys.entity_id
            LEFT JOIN entity_system_enhanced_view source_sys ON source_e.entity_id = source_sys.entity_id
            LEFT JOIN changes c_attr ON am.change_id = c_attr.change_id
            LEFT JOIN attribute_type at_target ON a_target.type_id = at_target.type_id
            LEFT JOIN attribute_type at_source ON a_source.type_id = at_source.type_id
            WHERE am.change_id IS NOT NULL;
        `);

        // 5. VIEW для зависимостей атрибутов с информацией о системах
        await queryRunner.query(`
            CREATE OR REPLACE VIEW attribute_dependency_enhanced_view AS
            SELECT 
                eam.entity_map_id,
                eam.source_attribute_id,
                a.name AS source_attribute_name,
                eam.deptype_id,
                
                -- Информация об атрибуте и его сущности
                a.entity_id AS source_entity_id,
                source_e.full_name AS source_entity_full_name,
                source_sys.system_code AS source_system_code,
                
                -- Информация о типе зависимости
                dt.name AS dependency_type_name,
                dt.description AS dependency_description,
                
                -- Дата изменения зависимости
                eam.change_id AS dependency_change_id,
                c_dep.change_date AS dependency_change_date
            FROM entity_attribute_map eam
            INNER JOIN attribute a ON eam.source_attribute_id = a.attribute_id
            INNER JOIN entity source_e ON a.entity_id = source_e.entity_id
            LEFT JOIN entity_system_enhanced_view source_sys ON source_e.entity_id = source_sys.entity_id
            INNER JOIN dependency_type dt ON eam.deptype_id = dt.deptype_id
            LEFT JOIN changes c_dep ON eam.change_id = c_dep.change_id
            WHERE eam.change_id IS NOT NULL;
        `);
// 6. Создаем VIEW для атрибутного маппинга
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

        // 7. Создаем VIEW для зависимостей атрибутов
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

        // 8. Создаем VIEW для источников процессов (группировка по источникам)
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

        // 9. Создаем VIEW для атрибутного маппинга с информацией о системе
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
            LEFT JOIN entity_system_enhanced_view source_sys ON source_e.entity_id = source_sys.entity_id
            LEFT JOIN changes c_attr ON am.change_id = c_attr.change_id;
        `);

        // 10. Создаем VIEW для зависимостей атрибутов с информацией о системе
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
            LEFT JOIN entity_system_enhanced_view source_sys ON source_e.entity_id = source_sys.entity_id
            LEFT JOIN changes c_dep ON eam.change_id = c_dep.change_id;
        `);

        // 11. Комплексный VIEW для формирования JSON
        await queryRunner.query(`
            CREATE OR REPLACE VIEW json_export_new_structure_view AS
            WITH aggregated_attributes AS (
                SELECT
                    am.entity_map_id,
                    am.source_entity_id,
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'src', am.source_attribute_name,
                            'dst', am.target_attribute_name,
                            'relation_change', am.attr_relation_change_date
                        ) ORDER BY am.source_attribute_name, am.target_attribute_name
                    ) FILTER (WHERE am.source_attribute_name IS NOT NULL) AS attr_maps_json
                FROM attribute_mapping_enhanced_view am
                GROUP BY am.entity_map_id, am.source_entity_id
            ),
            aggregated_dependencies AS (
                WITH dep_grouped AS (
                    SELECT
                        ad.entity_map_id,
                        ad.source_entity_id,
                        ad.source_attribute_name,
                        ARRAY_AGG(DISTINCT ad.dependency_type_name ORDER BY ad.dependency_type_name) AS link_types,
                        MAX(ad.dependency_change_date) AS max_change_date
                    FROM attribute_dependency_enhanced_view ad
                    GROUP BY ad.entity_map_id, ad.source_entity_id, ad.source_attribute_name
                )
                SELECT
                    entity_map_id,
                    source_entity_id,
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'attr', source_attribute_name,
                            'linkTypes', link_types,
                            'relation_change', max_change_date
                        ) ORDER BY source_attribute_name
                    ) FILTER (WHERE source_attribute_name IS NOT NULL) AS atr_deps_json
                FROM dep_grouped
                GROUP BY entity_map_id, source_entity_id
            )
            SELECT
                -- Информация о маппинге (целевая сущность)
                em.target_entity_full_name,
                em.target_system_code,
                em.relation_change_date,
            
                -- Информация о процессе (будет перенесена в deps)
                em.process_name,
                em.process_description,
                em.process_change_date,
            
                -- Информация об источнике
                ms.source_entity_full_name,
                ms.source_system_code,
                ms.source_relation_change_date,
                ms.source_process_name,
                ms.source_process_description,
                ms.source_process_change_date,
            
                -- Агрегированные атрибуты
                COALESCE(aa.attr_maps_json, '[]'::json) AS attr_maps,
                COALESCE(ad.atr_deps_json, '[]'::json) AS atr_deps,
            
                -- Неудачные маппинги
                em.failed_unmatched
            FROM entity_mapping_enhanced_view em
            INNER JOIN mapping_sources_enhanced_view ms ON em.entity_map_id = ms.entity_map_id
            LEFT JOIN aggregated_attributes aa ON em.entity_map_id = aa.entity_map_id
                AND ms.source_entity_id = aa.source_entity_id
            LEFT JOIN aggregated_dependencies ad ON em.entity_map_id = ad.entity_map_id
                AND ms.source_entity_id = ad.source_entity_id
            ORDER BY em.target_entity_full_name, ms.source_entity_full_name;
        `);

        // 12. Создаем индексы для производительности
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_mapping_enhanced 
            ON entity_map(entity_map_id) INCLUDE (entity_id, process_id, change_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_system_lookup 
            ON entity_container(entity_container_id, system_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_map_source_composite_enhanced 
            ON entity_map_source(entity_map_id, source_entity_id, change_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_attribute_map_composite_enhanced 
            ON attribute_map(entity_map_id, attribute_id, change_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_entity_attribute_map_composite_enhanced 
            ON entity_attribute_map(entity_map_id, source_attribute_id, deptype_id, change_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW IF EXISTS json_export_new_structure_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS attribute_dependency_enhanced_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS attribute_mapping_enhanced_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS mapping_sources_enhanced_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS entity_mapping_enhanced_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS entity_system_enhanced_view`);

        await queryRunner.query(`DROP VIEW IF EXISTS entity_attribute_mapping_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS attribute_mapping_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS entity_source_process_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS entity_attribute_dependency_view`);
        await queryRunner.query(`DROP VIEW IF EXISTS attribute_mapping_extended_view`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_attribute_map_composite_enhanced`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_attribute_map_composite_enhanced`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_map_source_composite_enhanced`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_system_lookup`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_entity_mapping_enhanced`);
    }
}