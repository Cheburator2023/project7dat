#!/bin/bash

echo "🚀 Запуск полного набора нагрузочных тестов для Data Lineage API"
echo "=================================================================="

# Проверка доступности сервера
echo "🔍 Проверка доступности сервера..."
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "❌ Сервер недоступен на http://localhost:3000"
    echo "   Убедитесь, что сервер запущен командой: npm run dev:server:nest"
    exit 1
fi
echo "✅ Сервер доступен"

# Создание директории для отчетов
REPORTS_DIR="reports/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORTS_DIR"

echo "📁 Отчеты будут сохранены в: $REPORTS_DIR"

# Функция для запуска теста с отчетом
run_test() {
    local test_name=$1
    local test_file=$2
    local description=$3
    
    echo ""
    echo "🧪 Запуск: $test_name"
    echo "   Описание: $description"
    echo "   Файл: $test_file"
    
    if artillery run "$test_file" --output "$REPORTS_DIR/${test_name}.json"; then
        echo "✅ $test_name завершен успешно"
        
        # Генерация HTML отчета
        if artillery report "$REPORTS_DIR/${test_name}.json" --output "$REPORTS_DIR/${test_name}.html"; then
            echo "📊 HTML отчет создан: $REPORTS_DIR/${test_name}.html"
        fi
    else
        echo "❌ $test_name завершился с ошибкой"
        return 1
    fi
}

# Генерация автоматических тестов из OpenAPI
echo ""
echo "🔄 Генерация тестов из OpenAPI спецификации..."
if node generate-from-openapi.js; then
    echo "✅ Автоматические тесты сгенерированы"
else
    echo "⚠️  Не удалось сгенерировать автоматические тесты"
fi

# Запуск всех тестов
echo ""
echo "🎯 Начинаем тестирование..."

# 1. Дымовое тестирование
run_test "smoke" "smoke-test.yml" "Быстрая проверка всех эндпоинтов"

# 2. Автоматически сгенерированные тесты
if [ -f "auto-generated-test.yml" ]; then
    run_test "auto-generated" "auto-generated-test.yml" "Автоматически сгенерированные тесты из OpenAPI"
fi

# 3. Базовое нагрузочное тестирование
run_test "basic-load" "basic-load-test.yml" "Базовое нагрузочное тестирование"

# 4. Стресс-тестирование (опционально)
read -p "🤔 Запустить стресс-тестирование? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    run_test "stress" "stress-test.yml" "Стресс-тестирование с высокой нагрузкой"
fi

# 5. Тест на выносливость (опционально)
read -p "🤔 Запустить тест на выносливость (30+ минут)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    run_test "endurance" "endurance-test.yml" "Тест на выносливость (длительный)"
fi

# Создание сводного отчета
echo ""
echo "📋 Создание сводного отчета..."

SUMMARY_FILE="$REPORTS_DIR/summary.md"
cat > "$SUMMARY_FILE" << EOF
# Сводный отчет нагрузочного тестирования

**Дата и время:** $(date)
**Цель:** http://localhost:3000
**Директория отчетов:** $REPORTS_DIR

## Выполненные тесты

EOF

for json_file in "$REPORTS_DIR"/*.json; do
    if [ -f "$json_file" ]; then
        test_name=$(basename "$json_file" .json)
        html_file="$REPORTS_DIR/${test_name}.html"
        
        echo "### $test_name" >> "$SUMMARY_FILE"
        echo "- JSON отчет: [${test_name}.json](./${test_name}.json)" >> "$SUMMARY_FILE"
        
        if [ -f "$html_file" ]; then
            echo "- HTML отчет: [${test_name}.html](./${test_name}.html)" >> "$SUMMARY_FILE"
        fi
        
        echo "" >> "$SUMMARY_FILE"
    fi
done

echo "✅ Сводный отчет создан: $SUMMARY_FILE"

# Генерация объединенного HTML отчета
echo ""
echo "🎨 Генерация объединенного HTML отчета..."
if node generate-combined-report.js; then
    COMBINED_REPORT_PATH=$(pwd)/combined-report.html
    echo "✅ Объединенный HTML отчет создан: $COMBINED_REPORT_PATH"
    echo "🌐 Откройте файл в браузере для просмотра красивого отчета"
    
    # Копирование отчета в директорию результатов
    cp combined-report.html "$REPORTS_DIR/combined-report.html"
    echo "📁 Копия отчета сохранена в: $REPORTS_DIR/combined-report.html"
else
    echo "⚠️  Не удалось создать объединенный HTML отчет"
fi

echo ""
echo "🎉 Тестирование завершено!"
echo "📊 Все отчеты доступны в директории: $REPORTS_DIR"
echo ""
echo "Для просмотра HTML отчетов откройте файлы .html в браузере"