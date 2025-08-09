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

async function testSnapshotLogic() {
  console.log('🧪 Тестирование логики применения снепшота...\n');
  
  try {
    console.log('1. Создание исходных JSON данных...');
    const initialData = await makeRequest('/api/json-commits/initialize', 'POST', {
      name: 'Тестовый график',
      description: 'Тест для снепшотов',
      data: {
        entities: [
          { id: 'entity1', name: 'Сущность 1' },
          { id: 'entity2', name: 'Сущность 2' }
        ],
        mappings: []
      }
    });
    
    const originalGraphId = initialData.id;
    console.log(`✅ Создан график с ID: ${originalGraphId}`);
    
    console.log('\n2. Создание коммита...');
    await makeRequest('/api/json-commits/commit', 'POST', {
      message: 'Первый коммит',
      data: {
        entities: [
          { id: 'entity1', name: 'Сущность 1 (обновлена)' },
          { id: 'entity2', name: 'Сущность 2' },
          { id: 'entity3', name: 'Новая сущность' }
        ],
        mappings: [{ from: 'entity1', to: 'entity3' }]
      }
    });
    console.log('✅ Коммит создан');
    
    console.log('\n3. Создание снепшота...');
    const snapshot = await makeRequest('/api/snapshots/create', 'POST', {
      name: 'Тестовый снепшот',
      description: 'Снепшот для тестирования'
    });
    
    const snapshotId = snapshot.id;
    console.log(`✅ Создан снепшот с ID: ${snapshotId}`);
    console.log(`📋 sourceDataId в снепшоте: ${snapshot.sourceDataId}`);
    
    if (snapshot.sourceDataId !== originalGraphId) {
      console.log(`❌ ОШИБКА: sourceDataId (${snapshot.sourceDataId}) не совпадает с originalGraphId (${originalGraphId})`);
      return;
    }
    
    console.log('\n4. Создание нового графика (изменение текущего состояния)...');
    const newData = await makeRequest('/api/json-commits/initialize', 'POST', {
      name: 'Новый график',
      description: 'Другие данные',
      data: {
        entities: [
          { id: 'different1', name: 'Другая сущность' }
        ],
        mappings: []
      }
    });
    
    const newGraphId = newData.id;
    console.log(`✅ Создан новый график с ID: ${newGraphId}`);
    
    console.log('\n5. Применение снепшота...');
    await makeRequest('/api/snapshots/apply', 'POST', {
      snapshotId: snapshotId,
      message: 'Применение тестового снепшота'
    });
    console.log('✅ Снепшот применен');
    
    console.log('\n6. Проверка восстановления исходного графика...');
    const currentData = await makeRequest('/api/json-data/current');
    
    console.log(`📋 ID текущего графика: ${currentData.id}`);
    console.log(`📋 ID исходного графика: ${originalGraphId}`);
    
    if (currentData.id === originalGraphId) {
      console.log('✅ УСПЕХ: Исходный график корректно восстановлен!');
      console.log('✅ sourceDataId работает правильно');
    } else {
      console.log(`❌ ОШИБКА: Текущий график (${currentData.id}) не совпадает с исходным (${originalGraphId})`);
      console.log('❌ sourceDataId игнорируется, создается новый json-data');
    }
    
  } catch (error) {
    console.log('❌ Ошибка при тестировании:', error);
  }
}

testSnapshotLogic();