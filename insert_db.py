#!/usr/bin/env python3
"""
Скрипт для подготовки INSERT-файла из бэкапа БД для переноса в целевую БД.
Особенности:
1. В целевой БД уже есть записи инициализации из миграции PopulateInitialData1760000000020
2. Эти записи имеют определенные фиксированные ID
3. Необходимо исключить дублирование этих записей при вставке
4. Сохранить целостность внешних ключей
"""

import re
import sys
from typing import Dict, List, Set, Tuple

def prepare_insert_file(input_file: str, output_file: str) -> None:
    """
    Подготавливает INSERT-файл для вставки в целевую БД.
    Исключает записи, которые уже есть в целевой БД из миграции PopulateInitialData1760000000020.

    Args:
        input_file: Путь к исходному SQL-файлу из pgAdmin
        output_file: Путь к выходному подготовленному файлу
    """

    # Данные из миграции PopulateInitialData1760000000020, которые уже есть в целевой БД
    # Эти записи нужно исключить из INSERT-файла
    EXISTING_DATA = {
        'changes': {
            'pk_column': 'change_id',
            'existing_ids': {1}
        },
        'entity_type': {
            'pk_column': 'entity_type_id',
            'existing_ids': {1, 3, 10, 11, 5}
        },
        'entity_container_type': {
            'pk_column': 'entity_container_type_id',
            'existing_ids': {1, 2}
        },
        'attribute_type': {
            'pk_column': 'type_id',
            'existing_ids': {1, 2, 3, 4, 5}
        },
        'process_type': {
            'pk_column': 'process_type_id',
            'existing_ids': {1, 2, 3}
        },
        'dependency_type': {
            'pk_column': 'deptype_id',
            'existing_ids': {'JOIN', 'WHERE', 'GROUP_BY', 'SELECT', 'ORDER_BY'}
        },
        'process_group': {
            'pk_column': 'group_id',
            'existing_ids': {1}
        },
        'systems': {
            'pk_column': 'system_id',
            'existing_ids': {1, 2}
        },
        'stream_space': {
            'pk_column': 'id',
            'existing_ids': {1, 2}
        }
    }

    # Таблицы, для которых нужно сбросить последовательности после вставки
    SEQUENCES = {
        'changes': 'changes_change_id_seq',
        'entity_type': 'entity_type_entity_type_id_seq',
        'entity_container_type': 'entity_container_type_entity_container_type_id_seq',
        'attribute_type': 'attribute_type_type_id_seq',
        'process_type': 'process_type_process_type_id_seq',
        'process_group': 'process_group_group_id_seq',
        'systems': 'systems_system_id_seq',
        'stream_space': 'stream_space_id_seq',
        'entity_container': 'entity_container_entity_container_id_seq',
        'entity': 'entity_entity_id_seq',
        'attribute': 'attribute_attribute_id_seq',
        'process': 'process_process_id_seq',
        'entity_map': 'entity_map_entity_map_id_seq',
        'attribute_map': 'attribute_map_attribute_map_id_seq',
        'failed_mappings': 'failed_mappings_failed_mapping_id_seq'
    }

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Разделяем на отдельные INSERT команды
        insert_pattern = re.compile(
            r'INSERT\s+INTO\s+([\w\.]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)\s*;',
            re.IGNORECASE | re.MULTILINE
        )

        # Также обрабатываем INSERT без указания столбцов
        insert_pattern_no_cols = re.compile(
            r'INSERT\s+INTO\s+([\w\.]+)\s*VALUES\s*\(([^)]+)\)\s*;',
            re.IGNORECASE | re.MULTILINE
        )

        # Находим все INSERT команды
        insert_statements = []

        for match in insert_pattern.finditer(content):
            table_name = match.group(1)
            columns = [col.strip().lower() for col in match.group(2).split(',')]
            values_str = match.group(3)

            # Определяем таблицу без схемы
            if '.' in table_name:
                _, table = table_name.split('.')
                table_name = table.lower()
            else:
                table_name = table_name.lower()

            insert_statements.append({
                'full_match': match.group(0),
                'table_name': table_name,
                'columns': columns,
                'values_str': values_str,
                'has_columns': True
            })

        for match in insert_pattern_no_cols.finditer(content):
            table_name = match.group(1)
            values_str = match.group(2)

            if '.' in table_name:
                _, table = table_name.split('.')
                table_name = table.lower()
            else:
                table_name = table_name.lower()

            insert_statements.append({
                'full_match': match.group(0),
                'table_name': table_name,
                'columns': None,  # Столбцы не указаны
                'values_str': values_str,
                'has_columns': False
            })

        # Сортируем INSERT по таблицам, чтобы сначала шли таблицы без зависимостей
        # Это важно для целостности внешних ключей
        table_order = [
            'changes',
            'entity_type',
            'entity_container_type',
            'attribute_type',
            'process_type',
            'dependency_type',
            'process_group',
            'systems',
            'stream_space',
            'entity_container',
            'entity',
            'attribute',
            'process',
            'entity_map',
            'attribute_map',
            'attribute_map_source',
            'entity_attribute_map',
            'failed_mappings'
        ]

        # Группируем INSERT по таблицам
        inserts_by_table = {}
        for stmt in insert_statements:
            table = stmt['table_name']
            if table not in inserts_by_table:
                inserts_by_table[table] = []
            inserts_by_table[table].append(stmt)

        # Собираем обработанные INSERT команды в правильном порядке
        processed_inserts = []
        table_statistics = {}
        max_change_id = 0

        for table in table_order:
            if table not in inserts_by_table:
                continue

            stats = {
                'total': len(inserts_by_table[table]),
                'inserted': 0,
                'skipped': 0
            }

            for stmt in inserts_by_table[table]:
                table_name = stmt['table_name']
                columns = stmt['columns']
                values_str = stmt['values_str']
                has_columns = stmt['has_columns']

                # Парсим значения
                values = parse_values(values_str)

                # Проверяем, нужно ли исключать эту запись
                should_insert = True

                if table_name in EXISTING_DATA:
                    pk_column = EXISTING_DATA[table_name]['pk_column']
                    existing_ids = EXISTING_DATA[table_name]['existing_ids']

                    if has_columns and columns:
                        # Столбцы указаны, находим индекс PK
                        try:
                            pk_idx = columns.index(pk_column.lower())
                            pk_value = values[pk_idx]

                            # Очищаем значение от кавычек и пробелов
                            pk_value = clean_value(pk_value)

                            # Проверяем, есть ли этот ID в существующих данных
                            if pk_value in existing_ids or (
                                isinstance(next(iter(existing_ids), None), int) and
                                pk_value.isdigit() and
                                int(pk_value) in existing_ids
                            ):
                                should_insert = False
                                stats['skipped'] += 1
                                continue

                            # Запоминаем максимальный change_id
                            if table_name == 'changes' and pk_column == 'change_id':
                                if pk_value.isdigit():
                                    change_id = int(pk_value)
                                    if change_id > max_change_id:
                                        max_change_id = change_id

                        except ValueError:
                            # Столбец PK не найден, вставляем как есть
                            pass
                    else:
                        # Столбцы не указаны, не можем проверить
                        # Вставляем все записи (риск дублирования)
                        print(f"[WARNING] INSERT без столбцов для таблицы {table_name}, проверьте вручную")

                # Вставляем запись
                processed_inserts.append(stmt['full_match'])
                stats['inserted'] += 1

            table_statistics[table] = stats

        # Создаем финальный SQL
        final_sql = []

        # Добавляем заголовок
        final_sql.append("-- ============================================")
        final_sql.append("-- ПОДГОТОВЛЕННЫЙ INSERT ФАЙЛ ДЛЯ ЦЕЛЕВОЙ БД")
        final_sql.append("-- Автоматически сгенерирован скриптом подготовки")
        final_sql.append("-- Исключены записи из миграции PopulateInitialData1760000000020")
        final_sql.append("-- ============================================\n")

        # Добавляем информацию об обработке
        final_sql.append("-- СТАТИСТИКА ОБРАБОТКИ:")
        for table, stats in table_statistics.items():
            final_sql.append(f"--   {table}: {stats['inserted']} из {stats['total']} записей "
                           f"(пропущено {stats['skipped']})")
        final_sql.append("")

        # Добавляем команду для отключения триггеров (опционально)
        final_sql.append("-- Временно отключаем триггеры для ускорения вставки")
        final_sql.append("SET session_replication_role = 'replica';\n")

        # Добавляем обработанные INSERT команды
        final_sql.append("-- ВСТАВКА ДАННЫХ")
        for insert in processed_inserts:
            final_sql.append(insert)

        # Включаем триггеры обратно
        final_sql.append("\n-- Включаем триггеры обратно")
        final_sql.append("SET session_replication_role = 'origin';\n")

        # Добавляем обновление последовательностей
        final_sql.append("-- ОБНОВЛЕНИЕ ПОСЛЕДОВАТЕЛЬНОСТЕЙ")
        final_sql.append("-- После вставки обновляем последовательности на максимальные значения")

        for table, seq_name in SEQUENCES.items():
            if table in table_statistics and table_statistics[table]['inserted'] > 0:
                if table == 'changes':
                    # Для changes используем вычисленный максимальный ID
                    if max_change_id > 0:
                        final_sql.append(f"SELECT setval('{seq_name}', {max_change_id + 1}, false);")
                else:
                    # Для остальных таблиц используем SELECT MAX
                    final_sql.append(f"SELECT setval('{seq_name}', COALESCE((SELECT MAX({EXISTING_DATA.get(table, {}).get('pk_column', 'id')}) FROM {table}), 1), false);")

        # Специальная обработка для dependency_type (строковый PK)
        final_sql.append("\n-- Специальные последовательности (если есть)")
        final_sql.append("-- dependency_type имеет строковый PK, последовательность не требуется")

        # Добавляем завершающий комментарий
        final_sql.append("\n-- ============================================")
        final_sql.append("-- ИНСТРУКЦИЯ ПО ИСПОЛЬЗОВАНИЮ:")
        final_sql.append("-- 1. Убедитесь, что в целевой БД выполнены все миграции")
        final_sql.append("-- 2. В частности, выполнена миграция PopulateInitialData1760000000020")
        final_sql.append("-- 3. Выполните этот файл в Query Tool PGAdmin целевой БД")
        final_sql.append("-- ============================================")

        # Сохраняем результат
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(final_sql))

        # Выводим статистику
        print("[SUCCESS] Файл успешно обработан:")
        print(f"  Входной файл: {input_file}")
        print(f"  Выходной файл: {output_file}")
        print(f"  Всего таблиц обработано: {len(table_statistics)}")

        total_inserted = sum(stats['inserted'] for stats in table_statistics.values())
        total_skipped = sum(stats['skipped'] for stats in table_statistics.values())

        print(f"  Всего записей: {total_inserted + total_skipped}")
        print(f"  Вставлено записей: {total_inserted}")
        print(f"  Пропущено записей (уже есть в целевой БД): {total_skipped}")

        if max_change_id > 0:
            print(f"  Максимальный change_id в файле: {max_change_id}")

        print("\n[ВАЖНО] Таблицы, записи которых были пропущены (уже есть в целевой БД):")
        for table in EXISTING_DATA.keys():
            if table in table_statistics and table_statistics[table]['skipped'] > 0:
                print(f"  - {table}: пропущено {table_statistics[table]['skipped']} записей")

    except FileNotFoundError:
        print(f"[ERROR] Файл не найден: {input_file}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Ошибка при обработке файла: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

def parse_values(values_str: str) -> List[str]:
    """
    Парсит строку значений из INSERT команды.

    Args:
        values_str: Строка со значениями, например: "1, 'text', NULL, 123"

    Returns:
        Список значений
    """
    values = []
    current_value = []
    in_single_quotes = False
    in_double_quotes = False
    escape_next = False

    for i, char in enumerate(values_str):
        if escape_next:
            current_value.append(char)
            escape_next = False
            continue

        if char == '\\':
            escape_next = True
            current_value.append(char)
            continue

        if char == "'" and not in_double_quotes:
            in_single_quotes = not in_single_quotes
            current_value.append(char)
        elif char == '"' and not in_single_quotes:
            in_double_quotes = not in_double_quotes
            current_value.append(char)
        elif char == ',' and not in_single_quotes and not in_double_quotes:
            values.append(''.join(current_value).strip())
            current_value = []
        else:
            current_value.append(char)

    if current_value:
        values.append(''.join(current_value).strip())

    return values

def clean_value(value: str):
    """Очищает значение от кавычек и пробелов."""
    if not value:
        return value

    value = value.strip()

    # Удаляем обрамляющие одинарные кавычки
    if value.startswith("'") and value.endswith("'"):
        value = value[1:-1]
    # Удаляем обрамляющие двойные кавычки
    elif value.startswith('"') and value.endswith('"'):
        value = value[1:-1]

    return value

def main():
    """Основная функция скрипта."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Подготовка INSERT-файла для переноса данных между БД',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры использования:
  python prepare_inserts.py backup.sql prepared.sql

Описание:
  Скрипт подготавливает INSERT-файл для вставки в целевую БД, которая уже содержит
  данные из миграции PopulateInitialData1760000000020. Эти данные исключаются из
  выходного файла, чтобы избежать дублирования.

Важные предварительные условия:
  1. В целевой БД должны быть выполнены ВСЕ миграции (1760000000001-1760000000021)
  2. В частности, выполнена миграция PopulateInitialData1760000000020
  3. Целевая БД должна иметь ту же структуру, что и исходная
        """
    )

    parser.add_argument(
        'input_file',
        help='Путь к исходному SQL-файлу из pgAdmin Backup'
    )

    parser.add_argument(
        'output_file',
        help='Путь для сохранения подготовленного SQL-файла'
    )

    args = parser.parse_args()

    # Запускаем обработку
    prepare_insert_file(
        input_file=args.input_file,
        output_file=args.output_file
    )

if __name__ == '__main__':
    main()