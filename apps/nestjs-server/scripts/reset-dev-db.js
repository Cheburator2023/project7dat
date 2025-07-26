#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEV_DB_PATH = path.join(__dirname, '..', 'dev-database');

function resetDevDatabase() {
  console.log('🔄 Сброс базы данных разработки...');
  
  // Проверяем, что мы не в продакшене
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ОШИБКА: Нельзя сбрасывать базу данных в продакшене!');
    process.exit(1);
  }

  // Проверяем существование папки dev-database
  if (!fs.existsSync(DEV_DB_PATH)) {
    console.log('ℹ️  Папка dev-database не существует. Нечего сбрасывать.');
    return;
  }

  try {
    // Безопасно удаляем папку dev-database
    fs.rmSync(DEV_DB_PATH, { recursive: true, force: true });
    console.log('✅ База данных разработки успешно сброшена!');
    console.log('💡 Запустите `npm run dev` для пересоздания базы данных.');
  } catch (error) {
    console.error('❌ Ошибка при сбросе базы данных:', error.message);
    process.exit(1);
  }
}

// Запускаем только если скрипт вызван напрямую
if (require.main === module) {
  resetDevDatabase();
}

module.exports = { resetDevDatabase };