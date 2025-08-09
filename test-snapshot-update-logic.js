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

async function testSnapshotUpdateLogic() {
    console.log('🧪 Тестирование логики обновления данных при применении снепшота...\n');

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

        console.log('\n2. Создание коммита...');
        const commitResponse = await makeRequest('/api/json-commits/commit', {
            method: 'POST',
            body: {
                message: 'Исходный коммит',
                data: initialData.data
            }
        });

        if (commitResponse.status !== 201) {
            throw new Error(`Ошибка создания коммита: ${commitResponse.status}`);
        }
        console.log('✅ Коммит создан');

        console.log('\n3. Создание снепшота...');
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

        console.log('\n4. Изменение данных исходного графика...');
        const modifiedData = {
            name: 'Измененный график',
            data: { nodes: [{ id: 'node1', label: 'Измененная нода' }, { id: 'node2', label: 'Новая нода' }], edges: [] },
            description: 'Измененное описание',
            version: '2.0.0'
        };

        const updateResponse = await makeRequest(`/api/json-data/update/${originalGraphId}`, {
            method: 'PUT',
            body: modifiedData
        });

        if (updateResponse.status !== 200) {
            throw new Error(`Ошибка обновления данных: ${updateResponse.status}`);
        }
        console.log('✅ Данные графика изменены');

        console.log('\n5. Проверка измененных данных...');
        const currentBeforeResponse = await makeRequest('/api/json-data/current');
        console.log(`📋 Название до применения снепшота: "${currentBeforeResponse.data.name}"`);
        console.log(`📋 Количество нод до применения: ${currentBeforeResponse.data.data.nodes.length}`);

        console.log('\n6. Применение снепшота...');
        const applyResponse = await makeRequest('/api/snapshots/apply', {
            method: 'POST',
            body: {
                snapshotId: snapshotId,
                message: 'Применение снепшота для тестирования обновления'
            }
        });

        if (applyResponse.status !== 200) {
            throw new Error(`Ошибка применения снепшота: ${applyResponse.status}`);
        }
        console.log('✅ Снепшот применен');

        console.log('\n7. Проверка восстановленных данных...');
        const currentAfterResponse = await makeRequest('/api/json-data/current');
        
        console.log(`📋 ID текущего графика: ${currentAfterResponse.data.id}`);
        console.log(`📋 ID исходного графика: ${originalGraphId}`);
        console.log(`📋 Название после применения снепшота: "${currentAfterResponse.data.name}"`);
        console.log(`📋 Количество нод после применения: ${currentAfterResponse.data.data.nodes.length}`);

        if (currentAfterResponse.data.id === originalGraphId) {
            console.log('✅ УСПЕХ: График обновлен, а не создан новый!');
            
            if (currentAfterResponse.data.name === initialData.name) {
                console.log('✅ УСПЕХ: Название корректно восстановлено!');
            } else {
                console.log('❌ ОШИБКА: Название не восстановлено');
            }
            
            if (currentAfterResponse.data.data.nodes.length === 1) {
                console.log('✅ УСПЕХ: Данные корректно восстановлены!');
            } else {
                console.log('❌ ОШИБКА: Данные не восстановлены');
            }
            
            console.log('✅ sourceDataId работает правильно - данные обновляются, а не создается новый график');
        } else {
            console.log('❌ ОШИБКА: Создан новый график вместо обновления существующего');
        }

    } catch (error) {
        console.error('❌ Ошибка в тесте:', error.message);
        process.exit(1);
    }
}

testSnapshotUpdateLogic();