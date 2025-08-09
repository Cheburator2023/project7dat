const http = require('http');

async function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const requestOptions = {
            hostname: 'localhost',
            port: 3000,
            path,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = http.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

async function testSimpleSnapshotUpdate() {
    console.log('🧪 Простой тест обновления данных при применении снепшота...\n');

    try {
        console.log('1. Создание исходных JSON данных...');
        const initialData = {
            name: 'Исходный график',
            data: { nodes: [{ id: 'node1', label: 'Исходная нода' }], edges: [] },
            description: 'Исходное описание',
            version: '1.0.0'
        };

        const initResponse = await makeRequest('/api/json-commits/initialize', {
            method: 'POST',
            body: initialData
        });

        if (initResponse.status !== 201) {
            throw new Error(`Ошибка создания данных: ${initResponse.status}`);
        }

        const originalGraphId = initResponse.data.id;
        console.log(`✅ Создан график с ID: ${originalGraphId}`);

        console.log('\n2. Создание снепшота...');
        const snapshotResponse = await makeRequest('/api/snapshots/create', {
            method: 'POST',
            body: {
                name: 'Тестовый снепшот',
                description: 'Снепшот для тестирования обновления'
            }
        });

        if (snapshotResponse.status !== 201) {
            throw new Error(`Ошибка создания снепшота: ${snapshotResponse.status}`);
        }

        const snapshotId = snapshotResponse.data.id;
        const sourceDataId = snapshotResponse.data.sourceDataId;
        console.log(`✅ Создан снепшот с ID: ${snapshotId}`);
        console.log(`📋 sourceDataId в снепшоте: ${sourceDataId}`);

        console.log('\n3. Создание нового графика (изменение текущего состояния)...');
        const newGraphResponse = await makeRequest('/api/json-commits/initialize', {
            method: 'POST',
            body: {
                name: 'Новый график',
                data: { nodes: [{ id: 'node2', label: 'Новая нода' }], edges: [] },
                description: 'Новое описание',
                version: '2.0.0'
            }
        });

        if (newGraphResponse.status !== 201) {
            throw new Error(`Ошибка создания нового графика: ${newGraphResponse.status}`);
        }

        const newGraphId = newGraphResponse.data.id;
        console.log(`✅ Создан новый график с ID: ${newGraphId}`);

        console.log('\n4. Проверка текущего состояния перед применением снепшота...');
        const currentBeforeResponse = await makeRequest('/api/json-data/current');
        console.log(`📋 ID текущего графика до применения: ${currentBeforeResponse.data.id}`);
        console.log(`📋 Название до применения: "${currentBeforeResponse.data.name}"`);

        console.log('\n5. Применение снепшота...');
        const applyResponse = await makeRequest('/api/snapshots/apply', {
            method: 'POST',
            body: {
                snapshotId: snapshotId,
                message: 'Применение снепшота для тестирования обновления'
            }
        });

        if (applyResponse.status !== 200 && applyResponse.status !== 201) {
            throw new Error(`Ошибка применения снепшота: ${applyResponse.status}`);
        }
        console.log('✅ Снепшот применен');

        console.log('\n6. Проверка результата...');
        const currentAfterResponse = await makeRequest('/api/json-data/current');
        
        console.log(`📋 ID текущего графика после применения: ${currentAfterResponse.data.id}`);
        console.log(`📋 ID исходного графика: ${originalGraphId}`);
        console.log(`📋 sourceDataId из снепшота: ${sourceDataId}`);
        console.log(`📋 Название после применения: "${currentAfterResponse.data.name}"`);

        if (currentAfterResponse.data.id === sourceDataId) {
            console.log('✅ УСПЕХ: График с правильным sourceDataId установлен как текущий!');
            
            if (currentAfterResponse.data.name === initialData.name) {
                console.log('✅ УСПЕХ: Название корректно восстановлено!');
            } else {
                console.log('❌ ОШИБКА: Название не восстановлено');
                console.log(`   Ожидалось: "${initialData.name}"`);
                console.log(`   Получено: "${currentAfterResponse.data.name}"`);
            }
            
            console.log('✅ sourceDataId работает правильно - данные обновляются по правильному ID');
        } else {
            console.log('❌ ОШИБКА: Неправильный график установлен как текущий');
            console.log(`   Ожидался ID: ${sourceDataId}`);
            console.log(`   Получен ID: ${currentAfterResponse.data.id}`);
        }

    } catch (error) {
        console.error('❌ Ошибка в тесте:', error.message);
        process.exit(1);
    }
}

testSimpleSnapshotUpdate();