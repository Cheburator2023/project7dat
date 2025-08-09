const API_BASE = 'http://localhost:3000';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }
  
  return await response.json();
}

async function testMetadataRestore() {
  console.log('🧪 Тест восстановления исходных метаданных...\n');
  
  try {
    console.log('1. Создание исходного графика...');
    const originalData = await makeRequest('/api/json-data/create', 'POST', {
      name: 'Исходное название',
      description: 'Исходное описание',
      data: {
        entities: [
          { id: 'entity1', name: 'Сущность 1' },
          { id: 'entity2', name: 'Сущность 2' }
        ],
        mappings: []
      }
    });
    
    const originalGraphId = originalData.id;
    console.log(`✅ Создан график с ID: ${originalGraphId}`);
    console.log(`📋 Исходное название: "${originalData.name}"`);
    console.log(`📋 Исходное описание: "${originalData.description}"`);
    
    console.log('\n2. Установка как текущий...');
    await makeRequest(`/api/json-data/set-current/${originalGraphId}`, 'POST', {});
    console.log('✅ График установлен как текущий');
    
    console.log('\n3. Создание снепшота...');
    const snapshot = await makeRequest('/api/snapshots/create', 'POST', {
      name: 'Название снепшота',
      description: 'Описание снепшота'
    });
    
    const snapshotId = snapshot.id;
    console.log(`✅ Создан снепшот с ID: ${snapshotId}`);
    console.log(`📋 Название снепшота: "${snapshot.name}"`);
    console.log(`📋 sourceDataId: ${snapshot.sourceDataId}`);
    
    console.log('\n4. Создание нового графика...');
    const newData = await makeRequest('/api/json-data/create', 'POST', {
      name: 'Новое название',
      description: 'Новое описание',
      data: {
        entities: [
          { id: 'different1', name: 'Другая сущность' }
        ],
        mappings: []
      }
    });
    
    console.log(`✅ Создан новый график с ID: ${newData.id}`);
    
    console.log('\n5. Установка нового графика как текущий...');
    await makeRequest(`/api/json-data/set-current/${newData.id}`, 'POST', {});
    console.log('✅ Новый график установлен как текущий');
    
    console.log('\n6. Применение снепшота...');
    await makeRequest('/api/snapshots/apply', 'POST', {
      snapshotId: snapshotId,
      message: 'Применение снепшота'
    });
    console.log('✅ Снепшот применен');
    
    console.log('\n7. Проверка восстановления...');
    const currentData = await makeRequest('/api/json-data/current');
    
    console.log(`📋 ID текущего графика: ${currentData.id}`);
    console.log(`📋 Название после применения: "${currentData.name}"`);
    console.log(`📋 Описание после применения: "${currentData.description}"`);
    
    if (currentData.id === originalGraphId) {
      console.log('✅ УСПЕХ: Правильный график восстановлен!');
      
      if (currentData.name === 'Исходное название') {
        console.log('✅ УСПЕХ: Исходное название восстановлено!');
      } else {
        console.log(`❌ ОШИБКА: Название не восстановлено. Ожидалось "Исходное название", получено "${currentData.name}"`);
      }
      
      if (currentData.description === 'Исходное описание') {
        console.log('✅ УСПЕХ: Исходное описание восстановлено!');
      } else {
        console.log(`❌ ОШИБКА: Описание не восстановлено. Ожидалось "Исходное описание", получено "${currentData.description}"`);
      }
    } else {
      console.log(`❌ ОШИБКА: Неправильный график. Ожидался ${originalGraphId}, получен ${currentData.id}`);
    }
    
  } catch (error) {
    console.log('❌ Ошибка при тестировании:', error);
  }
}

testMetadataRestore();