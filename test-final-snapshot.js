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

async function testFinalSnapshot() {
  console.log('🧪 Финальный тест функциональности снепшотов...\n');
  
  try {
    console.log('1. Создание первого графика...');
    const graph1 = await makeRequest('/api/json-data/create', 'POST', {
      name: 'График 1',
      description: 'Первый график для тестирования',
      data: {
        entities: [
          { id: 'entity1', name: 'Сущность 1' },
          { id: 'entity2', name: 'Сущность 2' }
        ],
        mappings: []
      }
    });
    
    console.log(`✅ Создан график 1 с ID: ${graph1.id}`);
    console.log(`📋 Название: "${graph1.name}"`);
    console.log(`📋 Описание: "${graph1.description}"`);
    
    console.log('\n2. Установка графика 1 как текущий...');
    await makeRequest(`/api/json-data/set-current/${graph1.id}`, 'POST', {});
    console.log('✅ График 1 установлен как текущий');
    
    console.log('\n3. Создание снепшота графика 1...');
    const snapshot1 = await makeRequest('/api/snapshots/create', 'POST', {
      name: 'Снепшот графика 1',
      description: 'Снепшот первого графика'
    });
    
    console.log(`✅ Создан снепшот с ID: ${snapshot1.id}`);
    console.log(`📋 sourceDataId: ${snapshot1.sourceDataId}`);
    
    if (snapshot1.sourceDataId !== graph1.id) {
      console.log(`❌ ОШИБКА: sourceDataId не совпадает с ID графика 1`);
      return;
    }
    
    console.log('\n4. Создание второго графика...');
    const graph2 = await makeRequest('/api/json-data/create', 'POST', {
      name: 'График 2',
      description: 'Второй график для тестирования',
      data: {
        entities: [
          { id: 'different1', name: 'Другая сущность' }
        ],
        mappings: []
      }
    });
    
    console.log(`✅ Создан график 2 с ID: ${graph2.id}`);
    
    console.log('\n5. Установка графика 2 как текущий...');
    await makeRequest(`/api/json-data/set-current/${graph2.id}`, 'POST', {});
    console.log('✅ График 2 установлен как текущий');
    
    console.log('\n6. Проверка текущего состояния...');
    let currentData = await makeRequest('/api/json-data/current');
    console.log(`📋 Текущий график: ${currentData.id} ("${currentData.name}")`);
    
    if (currentData.id !== graph2.id) {
      console.log(`❌ ОШИБКА: Текущий график должен быть график 2`);
      return;
    }
    
    console.log('\n7. Применение снепшота графика 1...');
    await makeRequest('/api/snapshots/apply', 'POST', {
      snapshotId: snapshot1.id,
      message: 'Восстановление графика 1'
    });
    console.log('✅ Снепшот применен');
    
    console.log('\n8. Проверка восстановления...');
    currentData = await makeRequest('/api/json-data/current');
    
    console.log(`📋 ID текущего графика: ${currentData.id}`);
    console.log(`📋 Название: "${currentData.name}"`);
    console.log(`📋 Описание: "${currentData.description}"`);
    
    // Проверяем, что восстановился правильный график
    if (currentData.id === graph1.id) {
      console.log('✅ УСПЕХ: Правильный график восстановлен!');
      
      // Проверяем исходные метаданные
      if (currentData.name === 'График 1') {
        console.log('✅ УСПЕХ: Исходное название восстановлено!');
      } else {
        console.log(`❌ ОШИБКА: Название не восстановлено. Ожидалось "График 1", получено "${currentData.name}"`);
      }
      
      if (currentData.description === 'Первый график для тестирования') {
        console.log('✅ УСПЕХ: Исходное описание восстановлено!');
      } else {
        console.log(`❌ ОШИБКА: Описание не восстановлено. Ожидалось "Первый график для тестирования", получено "${currentData.description}"`);
      }
      
      // Проверяем данные
      if (currentData.data.entities.length === 2) {
        console.log('✅ УСПЕХ: Исходные данные восстановлены!');
      } else {
        console.log(`❌ ОШИБКА: Данные не восстановлены. Ожидалось 2 сущности, получено ${currentData.data.entities.length}`);
      }
      
    } else {
      console.log(`❌ ОШИБКА: Неправильный график. Ожидался ${graph1.id}, получен ${currentData.id}`);
    }
    
    console.log('\n🎉 Тест завершен!');
    
  } catch (error) {
    console.log('❌ Ошибка при тестировании:', error);
  }
}

testFinalSnapshot();