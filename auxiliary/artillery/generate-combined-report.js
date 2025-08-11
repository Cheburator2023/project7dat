const fs = require('fs');
const path = require('path');

class CombinedReportGenerator {
    constructor() {
        this.reportsDir = './reports';
        this.outputFile = './combined-report.html';
        this.testResults = [];
    }

    async generateReport() {
        console.log('🔍 Поиск результатов тестов...');
        await this.collectTestResults();
        
        console.log('📊 Генерация объединенного отчета...');
        const htmlContent = this.generateHTML();
        
        fs.writeFileSync(this.outputFile, htmlContent, 'utf8');
        console.log(`✅ Объединенный отчет создан: ${path.resolve(this.outputFile)}`);
        
        return this.outputFile;
    }

    async collectTestResults() {
        if (!fs.existsSync(this.reportsDir)) {
            console.log('⚠️  Директория reports не найдена. Создаем пустой отчет.');
            return;
        }

        const items = fs.readdirSync(this.reportsDir);
        
        // Check for timestamped directories first
        const reportDirs = items
            .filter(item => fs.statSync(path.join(this.reportsDir, item)).isDirectory())
            .sort()
            .reverse();

        let jsonFiles = [];
        let reportPath = this.reportsDir;
        let timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

        if (reportDirs.length > 0) {
            // Use latest timestamped directory
            const latestReportDir = reportDirs[0];
            reportPath = path.join(this.reportsDir, latestReportDir);
            timestamp = latestReportDir;
            console.log(`📁 Используем результаты из: ${reportPath}`);
            jsonFiles = fs.readdirSync(reportPath).filter(file => file.endsWith('.json'));
        } else {
            // Look for JSON files directly in reports directory
            jsonFiles = items.filter(file => file.endsWith('.json'));
            if (jsonFiles.length > 0) {
                console.log(`📁 Используем результаты из: ${reportPath}`);
            }
        }

        if (jsonFiles.length === 0) {
            console.log('⚠️  Результаты тестов не найдены.');
            return;
        }

        for (const jsonFile of jsonFiles) {
            try {
                const filePath = path.join(reportPath, jsonFile);
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                
                const testName = path.basename(jsonFile, '.json');
                this.testResults.push({
                    name: testName,
                    displayName: this.getDisplayName(testName),
                    data: data,
                    timestamp: timestamp
                });
            } catch (error) {
                console.warn(`⚠️  Не удалось прочитать ${jsonFile}:`, error.message);
            }
        }
    }

    getDisplayName(testName) {
        const displayNames = {
            'smoke': 'Дымовое тестирование',
            'smoke-test': 'Дымовое тестирование',
            'basic-load': 'Базовое нагрузочное тестирование',
            'basic-load-test': 'Базовое нагрузочное тестирование',
            'stress': 'Стресс-тестирование',
            'stress-test': 'Стресс-тестирование',
            'endurance': 'Тест на выносливость',
            'endurance-test': 'Тест на выносливость',
            'auto-generated': 'Автоматически сгенерированные тесты',
            'auto-test': 'Автоматически сгенерированные тесты'
        };
        return displayNames[testName] || testName;
    }

    generateHTML() {
        const summary = this.generateSummary();
        const testSections = this.testResults.map(test => this.generateTestSection(test)).join('');

        return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Объединенный отчет Artillery - Data Lineage API</title>
    <style>
        ${this.getCSS()}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>📊 Объединенный отчет нагрузочного тестирования</h1>
            <div class="header-info">
                <span class="api-target">🎯 API: http://localhost:3000</span>
                <span class="timestamp">🕒 ${new Date().toLocaleString('ru-RU')}</span>
            </div>
        </header>

        ${summary}

        <div class="tests-container">
            ${testSections}
        </div>

        <footer class="footer">
            <p>Сгенерировано Artillery Load Testing Suite для Data Lineage API</p>
        </footer>
    </div>

    <script>
        ${this.getJavaScript()}
    </script>
</body>
</html>`;
    }

    generateSummary() {
        if (this.testResults.length === 0) {
            return `
            <div class="summary-section">
                <h2>📋 Сводка</h2>
                <div class="no-data">
                    <p>Результаты тестов не найдены. Запустите тесты командой:</p>
                    <code>npm run test:all</code>
                </div>
            </div>`;
        }

        const totalTests = this.testResults.length;
        const totalRequests = this.testResults.reduce((sum, test) => 
            sum + (test.data.aggregate?.counters?.['http.requests'] || 0), 0);
        const totalErrors = this.testResults.reduce((sum, test) => 
            sum + (test.data.aggregate?.counters?.['errors.total'] || 0), 0);
        const avgResponseTime = this.testResults.reduce((sum, test) => 
            sum + (test.data.aggregate?.latency?.mean || 0), 0) / totalTests;

        const successRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests * 100).toFixed(1) : 0;

        return `
        <div class="summary-section">
            <h2>📋 Общая сводка</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-value">${totalTests}</div>
                    <div class="summary-label">Выполнено тестов</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${totalRequests.toLocaleString()}</div>
                    <div class="summary-label">Всего запросов</div>
                </div>
                <div class="summary-card ${totalErrors > 0 ? 'error' : 'success'}">
                    <div class="summary-value">${totalErrors}</div>
                    <div class="summary-label">Ошибок</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${successRate}%</div>
                    <div class="summary-label">Успешность</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${avgResponseTime.toFixed(0)}ms</div>
                    <div class="summary-label">Среднее время отклика</div>
                </div>
            </div>
            
            <div class="charts-container">
                <div class="chart-wrapper">
                    <canvas id="responseTimeChart"></canvas>
                </div>
                <div class="chart-wrapper">
                    <canvas id="requestsChart"></canvas>
                </div>
            </div>
        </div>`;
    }

    generateTestSection(test) {
        const data = test.data;
        const aggregate = data.aggregate || {};
        const counters = aggregate.counters || {};
        const latency = aggregate.latency || {};
        
        const requests = counters['http.requests'] || 0;
        const errors = counters['errors.total'] || 0;
        const successRate = requests > 0 ? ((requests - errors) / requests * 100).toFixed(1) : 0;

        const statusClass = errors === 0 ? 'success' : errors < requests * 0.05 ? 'warning' : 'error';

        return `
        <div class="test-section">
            <div class="test-header ${statusClass}">
                <h3>${test.displayName}</h3>
                <div class="test-status">
                    ${errors === 0 ? '✅' : errors < requests * 0.05 ? '⚠️' : '❌'}
                    ${successRate}% успешность
                </div>
            </div>
            
            <div class="test-content">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${requests.toLocaleString()}</div>
                        <div class="metric-label">Запросов</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${errors}</div>
                        <div class="metric-label">Ошибок</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${(latency.mean || 0).toFixed(0)}ms</div>
                        <div class="metric-label">Среднее время</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${(latency.p95 || 0).toFixed(0)}ms</div>
                        <div class="metric-label">95-й перцентиль</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${(latency.p99 || 0).toFixed(0)}ms</div>
                        <div class="metric-label">99-й перцентиль</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${(aggregate.rates?.['http.request_rate'] || 0).toFixed(1)}</div>
                        <div class="metric-label">RPS</div>
                    </div>
                </div>

                ${this.generateLatencyTable(latency)}
                ${this.generateHttpCodesTable(counters)}
                ${this.generateScenariosTable(counters)}
            </div>
        </div>`;
    }

    generateLatencyTable(latency) {
        if (!latency || Object.keys(latency).length === 0) return '';

        return `
        <div class="details-section">
            <h4>⏱️ Время отклика</h4>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Метрика</th>
                        <th>Значение</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Минимальное</td><td>${(latency.min || 0).toFixed(1)}ms</td></tr>
                    <tr><td>Максимальное</td><td>${(latency.max || 0).toFixed(1)}ms</td></tr>
                    <tr><td>Среднее</td><td>${(latency.mean || 0).toFixed(1)}ms</td></tr>
                    <tr><td>Медиана (p50)</td><td>${(latency.median || 0).toFixed(1)}ms</td></tr>
                    <tr><td>95-й перцентиль</td><td>${(latency.p95 || 0).toFixed(1)}ms</td></tr>
                    <tr><td>99-й перцентиль</td><td>${(latency.p99 || 0).toFixed(1)}ms</td></tr>
                </tbody>
            </table>
        </div>`;
    }

    generateHttpCodesTable(counters) {
        const httpCodes = Object.keys(counters)
            .filter(key => key.startsWith('http.codes.'))
            .map(key => ({
                code: key.replace('http.codes.', ''),
                count: counters[key]
            }))
            .sort((a, b) => b.count - a.count);

        if (httpCodes.length === 0) return '';

        return `
        <div class="details-section">
            <h4>📊 HTTP коды ответов</h4>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Код</th>
                        <th>Количество</th>
                        <th>Процент</th>
                    </tr>
                </thead>
                <tbody>
                    ${httpCodes.map(item => {
                        const total = httpCodes.reduce((sum, code) => sum + code.count, 0);
                        const percent = ((item.count / total) * 100).toFixed(1);
                        const statusClass = item.code.startsWith('2') ? 'success' : 
                                          item.code.startsWith('4') || item.code.startsWith('5') ? 'error' : '';
                        return `<tr class="${statusClass}">
                            <td>${item.code}</td>
                            <td>${item.count.toLocaleString()}</td>
                            <td>${percent}%</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }

    generateScenariosTable(counters) {
        const scenarios = Object.keys(counters)
            .filter(key => key.startsWith('vusers.created_by_name.'))
            .map(key => ({
                name: key.replace('vusers.created_by_name.', ''),
                count: counters[key]
            }))
            .sort((a, b) => b.count - a.count);

        if (scenarios.length === 0) return '';

        return `
        <div class="details-section">
            <h4>🎭 Сценарии тестирования</h4>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Сценарий</th>
                        <th>Выполнений</th>
                    </tr>
                </thead>
                <tbody>
                    ${scenarios.slice(0, 10).map(scenario => 
                        `<tr>
                            <td>${scenario.name}</td>
                            <td>${scenario.count.toLocaleString()}</td>
                        </tr>`
                    ).join('')}
                </tbody>
            </table>
        </div>`;
    }

    getCSS() {
        return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
        }

        .header h1 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 2.5em;
        }

        .header-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
        }

        .header-info span {
            background: #f8f9fa;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 500;
        }

        .summary-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .summary-section h2 {
            color: #2c3e50;
            margin-bottom: 25px;
            font-size: 1.8em;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .summary-card {
            background: linear-gradient(135deg, #74b9ff, #0984e3);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        .summary-card:hover {
            transform: translateY(-5px);
        }

        .summary-card.success {
            background: linear-gradient(135deg, #00b894, #00a085);
        }

        .summary-card.error {
            background: linear-gradient(135deg, #e17055, #d63031);
        }

        .summary-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .summary-label {
            font-size: 0.9em;
            opacity: 0.9;
        }

        .charts-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 30px;
        }

        .chart-wrapper {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            height: 300px;
        }

        .tests-container {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }

        .test-section {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .test-header {
            padding: 25px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #eee;
        }

        .test-header.success {
            background: linear-gradient(135deg, #00b894, #00a085);
            color: white;
        }

        .test-header.warning {
            background: linear-gradient(135deg, #fdcb6e, #e17055);
            color: white;
        }

        .test-header.error {
            background: linear-gradient(135deg, #e17055, #d63031);
            color: white;
        }

        .test-header h3 {
            font-size: 1.4em;
        }

        .test-status {
            font-weight: bold;
            font-size: 1.1em;
        }

        .test-content {
            padding: 30px;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }

        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid transparent;
            transition: all 0.3s ease;
        }

        .metric-card:hover {
            border-color: #74b9ff;
            transform: translateY(-2px);
        }

        .metric-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }

        .metric-label {
            color: #636e72;
            font-size: 0.9em;
        }

        .details-section {
            margin-bottom: 25px;
        }

        .details-section h4 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.2em;
        }

        .details-table {
            width: 100%;
            border-collapse: collapse;
            background: #f8f9fa;
            border-radius: 8px;
            overflow: hidden;
        }

        .details-table th {
            background: #2c3e50;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }

        .details-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
        }

        .details-table tr:hover {
            background: #e9ecef;
        }

        .details-table tr.success {
            background: rgba(0, 184, 148, 0.1);
        }

        .details-table tr.error {
            background: rgba(225, 112, 85, 0.1);
        }

        .no-data {
            text-align: center;
            padding: 40px;
            color: #636e72;
        }

        .no-data code {
            background: #f1f3f4;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'Monaco', 'Consolas', monospace;
            display: inline-block;
            margin-top: 10px;
        }

        .footer {
            text-align: center;
            padding: 30px;
            color: white;
            margin-top: 30px;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header-info {
                flex-direction: column;
                gap: 10px;
            }
            
            .charts-container {
                grid-template-columns: 1fr;
            }
            
            .test-header {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
        }
        `;
    }

    getJavaScript() {
        const testData = this.testResults.map(test => ({
            name: test.displayName,
            responseTime: test.data.aggregate?.latency?.mean || 0,
            requests: test.data.aggregate?.counters?.['http.requests'] || 0,
            errors: test.data.aggregate?.counters?.['errors.total'] || 0
        }));

        return `
        document.addEventListener('DOMContentLoaded', function() {
            const testData = ${JSON.stringify(testData)};
            
            if (testData.length === 0) return;

            // График времени отклика
            const responseTimeCtx = document.getElementById('responseTimeChart');
            if (responseTimeCtx) {
                new Chart(responseTimeCtx, {
                    type: 'bar',
                    data: {
                        labels: testData.map(t => t.name),
                        datasets: [{
                            label: 'Среднее время отклика (ms)',
                            data: testData.map(t => t.responseTime),
                            backgroundColor: 'rgba(116, 185, 255, 0.8)',
                            borderColor: 'rgba(116, 185, 255, 1)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Время отклика по тестам'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Миллисекунды'
                                }
                            }
                        }
                    }
                });
            }

            // График запросов и ошибок
            const requestsCtx = document.getElementById('requestsChart');
            if (requestsCtx) {
                new Chart(requestsCtx, {
                    type: 'bar',
                    data: {
                        labels: testData.map(t => t.name),
                        datasets: [{
                            label: 'Успешные запросы',
                            data: testData.map(t => t.requests - t.errors),
                            backgroundColor: 'rgba(0, 184, 148, 0.8)',
                            borderColor: 'rgba(0, 184, 148, 1)',
                            borderWidth: 2
                        }, {
                            label: 'Ошибки',
                            data: testData.map(t => t.errors),
                            backgroundColor: 'rgba(225, 112, 85, 0.8)',
                            borderColor: 'rgba(225, 112, 85, 1)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Запросы и ошибки по тестам'
                            }
                        },
                        scales: {
                            x: {
                                stacked: true
                            },
                            y: {
                                stacked: true,
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Количество запросов'
                                }
                            }
                        }
                    }
                });
            }
        });
        `;
    }
}

// Запуск генератора
if (require.main === module) {
    const generator = new CombinedReportGenerator();
    generator.generateReport().catch(console.error);
}

module.exports = CombinedReportGenerator;