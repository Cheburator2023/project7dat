import {MigrationInterface, QueryRunner} from "typeorm";

export class PopulateInitialData1760000000020 implements MigrationInterface {
    name = "PopulateInitialData1760000000020";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO changes (change_date, change_user, change_name, app_id, schema_version, user_id)
            VALUES (CURRENT_TIMESTAMP, 'SYSTEM', 'FIRST DATA MIGRATION', NULL, '1.0', 'SYSTEM')
        `);

        const result = await queryRunner.query(`
            SELECT change_id FROM changes 
            WHERE change_user = 'SYSTEM' AND change_name = 'FIRST DATA MIGRATION'
        `);
        const changeId = result[0].change_id;

        await queryRunner.query(`
            INSERT INTO entity_type (entity_type_id, change_id, name, description)
            VALUES (1, $1, 'TABLE_HIVE', 'Таблица HIVE'),
                   (2, $1, 'VIEW_HIVE', 'Представление HIVE'),
                   (3, $1, 'JSON', 'JSON файл'),
                   (4, $1, 'INPUT_VECTOR', 'Входной вектор')
        `, [changeId]);

        await queryRunner.query(`
            INSERT INTO entity_container_type (entity_container_type_id, change_id, value, description)
            VALUES (1, $1, 'DB_HIVE', 'БД Hive'),
                   (2, $1, 'MODEL', 'Модель данных')
        `, [changeId]);

        await queryRunner.query(`
            INSERT INTO attribute_type (type_id, change_id, name, description, type_group)
            VALUES (1, $1, 'string', 'Строковый тип', 'HIVE'),
                   (2, $1, 'integer', 'Целочисленный тип', 'HIVE'),
                   (3, $1, 'decimal', 'Десятичный тип', 'HIVE'),
                   (4, $1, 'timestamp', 'Тип временной метки', 'HIVE'),
                   (5, $1, 'boolean', 'Логический тип', 'HIVE')
        `, [changeId]);

        await queryRunner.query(`
            INSERT INTO process_type (process_type_id, change_id, name, description)
            VALUES (1, $1, 'DAG_AIRFLOW', 'Процесс Airflow DAG'),
                   (2, $1, 'SPARK_JOB', 'Spark задание'),
                   (3, $1, 'AUTO_MAPPER', 'Автоматический маппер')
        `, [changeId]);

        await queryRunner.query(`
            INSERT INTO dependency_type (deptype_id, change_id, name, description)
            VALUES (1, $1, 'TABLE_HIVE', 'Таблица Hive'),
                   (3, $1, 'VIEW_HIVE', 'Представление HIVE'),
                   (10, $1, 'JSON', 'Запрос в ПИМ'),
                   (11, $1, 'INPUT_VECTOR', 'Входящий вектор модели'),
                   (5, $1, 'OUTPUT_VECTOR', 'Исходящий вектор модели')
        `, [changeId]);

        await queryRunner.query(`
            INSERT INTO process_group (group_id, change_id, name, description)
            VALUES (1, $1, 'DEFAULT_GROUP', 'Группа по умолчанию')
        `, [changeId]);

        await queryRunner.query(`
            INSERT INTO systems (system_id, code, name)
            VALUES (1, 'SYS1', 'Основная система данных'),
                   (2, 'SYS2', 'Вспомогательная система')
        `);

        await queryRunner.query(`
            INSERT INTO stream_space (id, name_space, stream_name)
            VALUES (1, 'prod_dm_dadm_corp_wide', 'Основной поток данных'),
                   (2, 'prod_repl_subo_csep', 'Поток репликации CSEP')
        `);

        await queryRunner.query(`
            SELECT setval('changes_change_id_seq', (SELECT MAX(change_id) FROM changes))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM stream_space`);
        await queryRunner.query(`DELETE FROM systems`);
        await queryRunner.query(`DELETE FROM process_group`);
        await queryRunner.query(`DELETE FROM dependency_type`);
        await queryRunner.query(`DELETE FROM process_type`);
        await queryRunner.query(`DELETE FROM attribute_type`);
        await queryRunner.query(`DELETE FROM entity_container_type`);
        await queryRunner.query(`DELETE FROM entity_type`);
        await queryRunner.query(`DELETE FROM changes WHERE change_user = 'SYSTEM' AND change_name = 'FIRST DATA MIGRATION'`);
    }
}
