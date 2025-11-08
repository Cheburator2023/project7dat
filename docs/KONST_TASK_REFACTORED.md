# Анализ требований к системе Data Lineage (DL)

## 1. Глоссарий ключевых терминов

- **Инкремент** - файл обновления модели данных (S2T, JSON)
- **Коммит** - загруженный инкремент с метаданными
- **Очередь коммитов** - список коммитов для последовательного применения к БД
- **Модель данных** - граф объектов и их связей в DL
- **Снепшот** - версионированное состояние модели данных
- **Ченжлог** - журнал изменений с метаданными
- **Витрина/Источник** - типы объектов в модели
- **Мердж** - применение коммита к текущей версии модели

---

## 2. Основные сценарии использования

### 2.1 Авторизация
**Stack**: JWT token из СУМ (единая система управления)

**Роли**:
- Все авторизованные пользователи → просмотр
- "Архитектор данных" → загрузка и подтверждение коммитов

**Будущее**: права на редактирование по таблице соответствия стримов и namespace

---

### 2.2 Загрузка коммита (сценарии 2-3)

#### Основной флоу загрузки:

**Frontend**:
```
1. Пользователь → Меню "Инкременты" → Окно "Очередь коммитов"
2. Отображение списка несмерженных коммитов:
   - Сортировка: по времени загрузки (давние сверху)
   - Поля: название, автор, статус, дата, тип файла
   - Подсветка невалидных коммитов
3. Кнопка "Добавить" → file picker (JSON)
4. Модальное окно для метаданных:
   - Название (default: desc.appName из JSON до точки)
   - Описание
5. Предварительная валидация на фронте:
   - Формат JSON
   - Размер < 1 МБ
   - При ошибке → диалог с ошибкой, загрузка отменяется
```

**Backend API**:
```typescript
POST /api/commits
Body: {
  file: File,
  name: string,
  description: string
}

Response: {
  id: string,
  status: 'validated' | 'validation_failed',
  errors?: string[]
}
```

**Таблица БД commits**:
- id (UUID)
- filename
- name
- description
- author
- upload_date
- status
- file_content (JSONB)
- validation_errors

#### Дополнительные действия:

**Редактирование коммита**:
```
1. Выбор коммита → кнопка "Править"
2. Модальное окно с текущими данными
3. PATCH /api/commits/{id} → обновление name/description
```

**Просмотр содержимого**:
```
1. Двойной клик по коммиту
2. Модальное окно с JSON preview
```

**Замена невалидного коммита**:
```
1. Выбор коммита со статусом "validation_failed"
2. Кнопка "Заменить" (disabled для validated)
3. Загрузка нового файла
4. PUT /api/commits/{id}/replace
```

---

### 2.3 Мердж коммита (сценарии 4-5)

#### Основной флоу:

**Условие**: первый коммит в очереди имеет статус "validated"

**Frontend**:
```
1. Очередь коммитов → кнопка "Применить" (только для первого validated)
2. Запрос к Parsing Service
3. Получение двух JSON:
   - Смерженная версия (только затронутые объекты)
   - Diff (изменения)
4. Открытие двух окон:
   - "Merge Граф объектов {process_name}"
   - "Diff"
5. Визуальное выделение новых/измененных объектов
6. Меню "Инкременты" → добавляются пункты:
   - "Подтвердить"
   - "Отменить"
```

**Backend API**:
```typescript
POST /api/commits/{id}/merge
Response: {
  merged_json: object,  // только затронутые объекты + их контекст
  diff_json: {
    added: object[],
    modified: object[],
    deleted: object[]
  }
}

POST /api/commits/{id}/confirm
// Применяет изменения к основной БД, создает snapshot

POST /api/commits/{id}/cancel
// Отменяет мердж, очищает временные данные
```

**После подтверждения/отмены**:
- Закрыть все окна кроме главного
- Скрыть пункты "Подтвердить"/"Отменить"
- Очистить кэш JSON

---

### 2.4 Поиск объектов (сценарий 6)

**Frontend**:
```
Меню "Поиск" → окно с полями:
- Признак (attribute.name)
- Витрина (entity.name)
- Модель (entity_container.value)
- Кнопка "Искать"

Результаты в таблице:
- Название сущности
- Тип
- Описание
- Модель
- БД
- Процесс + описание
```

**Backend API**:
```typescript
GET /api/search?
  attribute={name}&
  entity={name}&
  model={name}

Response: {
  results: Array<{
    name: string,
    type: 'attribute' | 'entity' | 'vector' | 'model',
    description: string,
    model?: string,
    database?: string,
    process?: string,
    process_description?: string
  }>
}
```

**Логика поиска**:
- Пустые поля игнорируются
- Поиск по точному совпадению
- Если заполнены несколько полей → AND условие

---

### 2.5 Просмотр графа объектов (сценарии 7-9)

#### Вариант 1: От модели

**Frontend флоу**:
```
1. Меню "Модели" → список моделей
2. Поиск по названию
3. Двойной клик или "Просмотр"
4. Проверка кэша JSON (если есть → skip запрос)
5. GET /api/models/{id}/graph
6. Рендер графа:
   - Модель → Вектор → Витрины → Источники
   - Разные цвета для разных типов объектов
   - Без отображения атрибутов (аргументов)
```

#### Вариант 2: От процесса

**Frontend флоу**:
```
1. Меню "Процессы" → список процессов
2. Двойной клик или "Просмотр"
3. GET /api/processes/{id}/graph
4. Рендер графа: Источники → Витрины + связи
```

**Backend API**:
```typescript
GET /api/models/{id}/graph
GET /api/processes/{id}/graph

Response: {
  nodes: Array<{
    id: string,
    type: 'model' | 'vector' | 'entity' | 'source',
    name: string,
    description: string
  }>,
  edges: Array<{
    source_id: string,
    target_id: string,
    type: string
  }>
}
```

#### Взаимодействие с объектами графа

**ПКМ на объект → контекстное меню**:

1. **"Признаки"** или двойной клик:
```
Модальное окно "Признаки {object_name}":
- Тип, название, описание объекта
- Поле поиска по признакам
- Список атрибутов: название, тип, описание

GET /api/objects/{id}/attributes
```

2. **"Связи"**:
```
Модальное окно "Связи {object_name}":
- Тип, название, описание объекта
- Список связей с другими объектами
- Описание каждой связи

GET /api/objects/{id}/relations
```

3. **"Модели"**:
```
Модальное окно "Модели":
- Информация об объекте
- Список моделей, где используется объект
- Название модели + описание

GET /api/objects/{id}/models
```

**Двойной клик на связь (edge)**:
```
Окно "Связь {source} -> {target}":
- Переключатель: "Маппинг" / "Функции"
- Маппинг: source_attr → target_attr с описаниями
- Функции: атрибут + его функция преобразования

GET /api/relations/{id}/mapping
GET /api/relations/{id}/functions
```

---

### 2.6 Фильтры графа

**Контекстное меню (ПКМ) на пустом месте графа**:

1. **"Убрать временные таблицы"**:
   - Скрыть объекты с "tmp" в имени (case-insensitive)
   - Состояние в Zustand store

2. **"Отображать временные таблицы"**:
   - Показать все объекты

**Выделение связанных объектов**:
```
Клик на объект:
- Объект выделяется (border/background)
- Выделяются прямо связанные объекты
- Опционально: вся цепочка до источников и моделей
```

---

### 2.7 История изменений (сценарий 11)

**Frontend**:
```
Меню "История изменений" → окно со списком:

Колонки:
- ID версии
- Дата изменения
- ФИО пользователя
- Процесс
- Объект
- Тип объекта
- Тип изменения (added/updated/deleted)

Сортировка: дата, пользователь, процесс
Двойной клик → модальное окно с JSON diff (было/стало)
```

**Backend API**:
```typescript
GET /api/changelog?
  sort_by=date&
  order=desc&
  limit=100&
  offset=0

Response: {
  total: number,
  items: Array<{
    version_id: string,
    date: string,
    user_name: string,
    process_name: string,
    object_name: string,
    object_type: string,
    change_type: 'added' | 'updated' | 'deleted'
  }>
}

GET /api/changelog/{version_id}/diff
Response: {
  before: object,
  after: object
}
```

---

### 2.8 Просмотр DIFF коммита (сценарий 12)

**Контекст**: коммит применен, но не подтвержден

**Frontend**:
```
Окно "Diff" содержит:
1. Метаданные коммита:
   - Название
   - Автор
   - Дата загрузки
   - Тип файла

2. Список измененных таблиц:
   - Source/Target
   - Вектор
   - Модель
   - Тип изменения

3. Два JSON редактора (side-by-side):
   - "Было" (текущая версия)
   - "Стало" (после коммита)

4. Навигация между изменениями (<<< >>>)

При выборе объекта из списка:
- JSON обновляется для этого объекта
- Для новых объектов → только "Стало"
- Подсветка измененных строк
```

**Backend**:
```typescript
GET /api/commits/{id}/diff-details
Response: {
  commit_info: {
    name: string,
    author: string,
    upload_date: string,
    file_type: string
  },
  changes: Array<{
    object_id: string,
    object_name: string,
    object_type: string,
    vector?: string,
    model?: string,
    change_type: 'added' | 'modified' | 'deleted',
    before: object | null,
    after: object | null
  }>
}
```

---

## 3. Обнаруженные дублирования

### 3.1 Просмотр объектов графа
Сценарий "Просмотр объектов графа" (п. 10) повторяется дважды:
- В "Основной сценарий 1: Просмотр актуальной модели данных"
- В "Основной сценарий 2: Просмотр актуальных витрин процесса"

**Рекомендация**: вынести в отдельный переиспользуемый компонент `ObjectGraphViewer` с общей логикой взаимодействия.

### 3.2 Модальные окна для метаданных
Структура модальных окон повторяется в нескольких местах:
- Загрузка коммита
- Редактирование коммита
- Просмотр признаков/связей/моделей

**Рекомендация**: создать базовые компоненты:
- `CommitMetadataModal`
- `ObjectDetailsModal`

---

## 4. Сомнительные места в логике

### 4.1 🔴 Критичные вопросы

**1. Очередь коммитов - строгая последовательность?**
```
Проблема: Можно ли применять только первый коммит в очереди?
Что если коммит 1 зависит от коммита 2?

Рекомендации:
- Реализовать проверку зависимостей между коммитами
- Добавить возможность изменения порядка (drag-and-drop)
- Или запретить загрузку новых коммитов до подтверждения текущего
```

**2. Размер кэшируемых JSON**
```
Проблема: Модели могут быть огромными, кэширование на фронте 
может привести к утечкам памяти

Рекомендации:
- Добавить TTL для кэша
- Ограничить количество одновременно открытых графов
- Использовать пагинацию для больших графов
- Рассмотреть server-side рендеринг графов
```

**3. Обработка конфликтов при мердже**
```
Проблема: Что делать, если два коммита изменяют один объект?

Не описано:
- UI для разрешения конфликтов
- Стратегия мерджа (последний выигрывает? ручное разрешение?)
- Откат в случае ошибки
```

### 4.2 ⚠️ Недостающая функциональность

**1. Валидация коммитов**
```
Не описано:
- Какие конкретно правила валидации?
- Schema validation?
- Business rules validation?
- Проверка ссылочной целостности?
```

**2. Управление версиями**
```
Не описано:
- Можно ли откатиться к предыдущей версии?
- Как просматривать модель данных на прошлую дату?
- Ветвление версий?
```

**3. Права доступа**
```
Не полностью описано:
- Как реализовать таблицу соответствия стримов и namespace?
- Гранулярность прав (на уровне модели/процесса/объекта)?
- Аудит действий пользователей?
```

### 4.3 🟡 UX проблемы

**1. Навигация между окнами**
```
Проблема: Открывается много окон, легко потеряться

Рекомендации:
- Breadcrumbs для навигации
- Tabs вместо множественных окон
- История навигации (back/forward)
```

**2. Поиск в графе**
```
Проблема: В большом графе сложно найти объект визуально

Рекомендации:
- Добавить поиск прямо в окне графа
- Highlight найденных объектов
- Zoom to fit выбранного объекта
```

**3. Производительность графов**
```
Проблема: Рендеринг больших графов может тормозить

Рекомендации:
- Виртуализация (рендер только видимой области)
- Lazy loading связей
- Упрощенный режим отображения (без деталей)
- WebGL для рендеринга (react-force-graph)
```

### 4.4 🔵 Технические детали

**1. Формат JSON коммитов**
```
Не описано:
- Точная структура JSON
- Версионирование формата
- Миграции при изменении схемы
```

**2. Parsing Service**
```
Не описано:
- Таймауты запросов (парсинг может быть долгим)
- Обработка ошибок парсинга
- Прогресс-бар для длительных операций
```

**3. Кэширование**
```
Не описано:
- Где хранить кэш (memory/localStorage/IndexedDB)?
- Инвалидация кэша при обновлении данных
- Синхронизация между табами
```

---

## 5. Рекомендации по имплементации

### 5.1 Архитектура стора (Zustand)

```typescript
// stores/commitsStore.ts
interface CommitsStore {
  queue: Commit[];
  currentMerge: MergeState | null;
  loadQueue: () => Promise<void>;
  uploadCommit: (file: File, metadata: CommitMetadata) => Promise<void>;
  applyCommit: (id: string) => Promise<void>;
  confirmMerge: () => Promise<void>;
  cancelMerge: () => void;
}

// stores/graphStore.ts
interface GraphStore {
  cache: Map<string, GraphData>;
  currentGraph: GraphData | null;
  filters: GraphFilters;
  loadGraph: (type: 'model' | 'process', id: string) => Promise<void>;
  toggleFilter: (filter: keyof GraphFilters) => void;
}

// stores/searchStore.ts
interface SearchStore {
  results: SearchResult[];
  search: (query: SearchQuery) => Promise<void>;
}
```

### 5.2 Компоненты

```
src/
├── features/
│   ├── commits/
│   │   ├── CommitQueue.tsx
│   │   ├── CommitUploadDialog.tsx
│   │   ├── CommitMergeView.tsx
│   │   └── CommitDiffViewer.tsx
│   ├── graph/
│   │   ├── ObjectGraph.tsx
│   │   ├── GraphContextMenu.tsx
│   │   ├── ObjectDetailsDialog.tsx
│   │   └── RelationDetailsDialog.tsx
│   ├── search/
│   │   └── SearchPanel.tsx
│   └── changelog/
│       └── ChangelogViewer.tsx
└── shared/
    ├── components/
    │   ├── JsonViewer.tsx
    │   └── DiffViewer.tsx
    └── hooks/
        ├── useGraphData.ts
        └── useCommitQueue.ts
```

### 5.3 API Routes (NestJS)

```typescript
// modules/commits/commits.controller.ts
@Controller('commits')
export class CommitsController {
  @Post() uploadCommit(@Body() dto: UploadCommitDto) {}
  @Get() getQueue() {}
  @Patch(':id') updateCommit(@Param('id') id: string) {}
  @Put(':id/replace') replaceCommit(@Param('id') id: string) {}
  @Post(':id/merge') mergeCommit(@Param('id') id: string) {}
  @Post(':id/confirm') confirmCommit(@Param('id') id: string) {}
  @Post(':id/cancel') cancelCommit(@Param('id') id: string) {}
  @Get(':id/diff-details') getDiffDetails(@Param('id') id: string) {}
}

// modules/graph/graph.controller.ts
@Controller('graph')
export class GraphController {
  @Get('models/:id') getModelGraph(@Param('id') id: string) {}
  @Get('processes/:id') getProcessGraph(@Param('id') id: string) {}
}

// modules/objects/objects.controller.ts
@Controller('objects')
export class ObjectsController {
  @Get(':id/attributes') getAttributes(@Param('id') id: string) {}
  @Get(':id/relations') getRelations(@Param('id') id: string) {}
  @Get(':id/models') getRelatedModels(@Param('id') id: string) {}
}

// modules/search/search.controller.ts
@Controller('search')
export class SearchController {
  @Get() search(@Query() query: SearchQueryDto) {}
}

// modules/changelog/changelog.controller.ts
@Controller('changelog')
export class ChangelogController {
  @Get() getChangelog(@Query() query: ChangelogQueryDto) {}
  @Get(':id/diff') getDiff(@Param('id') id: string) {}
}
```

### 5.4 Библиотеки для графов

Рекомендуемые опции:
1. **react-force-graph** - для больших графов с WebGL
2. **react-flow** - более простой, декларативный
3. **cytoscape.js** - мощный, но сложнее в настройке

---

## 6. План разработки по приоритетам

### Phase 1 (MVP)
1. ✅ Авторизация + JWT
2. ✅ Загрузка коммитов в очередь
3. ✅ Базовая валидация
4. ✅ Просмотр очереди

### Phase 2
5. ✅ Мердж коммитов
6. ✅ Diff viewer (side-by-side JSON)
7. ✅ Подтверждение/отмена мерджа

### Phase 3
8. ✅ Граф объектов (модели)
9. ✅ Граф объектов (процессы)
10. ✅ Взаимодействие с объектами графа

### Phase 4
11. ✅ Поиск объектов
12. ✅ История изменений
13. ✅ Фильтры графов

### Phase 5 (Enhancement)
14. ⚠️ Управление версиями
15. ⚠️ Разрешение конфликтов
16. ⚠️ Расширенные права доступа
17. ⚠️ Оптимизация производительности