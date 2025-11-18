Схема РБД DL

Схема РБД Data Lineage
# Database Schema Documentation

## Core Entities

### **entity**
Main entity table storing core business objects.

| Column | Type | Description |
|--------|------|-------------|
| `entity_id` | numeric | Primary key |
| `change_id` | numeric | Foreign key to changes |
| `entity_type_id` | numeric | Foreign key to entity_type |
| `entity_container_id` | numeric | Foreign key to entity_container |
| `name` | string | Entity name |
| `full_name` | string | Full entity name |
| `description` | string | Entity description |

---

### **entity_type**
Defines types/categories of entities.

| Column | Type | Description |
|--------|------|-------------|
| `entity_type_id` | numeric | Primary key |
| `name` | string | Type name |
| `description` | string | Type description |

---

### **entity_container**
Hierarchical container structure for organizing entities.

| Column | Type | Description |
|--------|------|-------------|
| `entity_container_id` | numeric | Primary key |
| `change_id` | numeric | Foreign key to changes |
| `entity_container_type_id` | numeric | Foreign key to entity_container_type |
| `value` | string | Container value |
| `description` | string | Container description |
| `system_id` | numeric | Foreign key to systems |

---

### **entity_container_type**
Types of entity containers.

| Column | Type | Description |
|--------|------|-------------|
| `entity_container_type_id` | numeric | Primary key |
| `name` | string | Type name |
| `description` | string | Type description |

---

## Attributes & Mapping

### **attribute**
Attribute definitions for entities.

| Column | Type | Description |
|--------|------|-------------|
| `attribute_id` | numeric | Primary key |
| `change_id` | numeric | Foreign key to changes |
| `entity_id` | numeric | Foreign key to entity |
| `name` | string | Attribute name |
| `type_id` | string | Type identifier |
| `description` | string | Attribute description |

---

### **attribute_type**
Defines attribute data types.

| Column | Type | Description |
|--------|------|-------------|
| `type_id` | numeric | Primary key |
| `name` | string | Type name |
| `description` | string | Type description |
| `type_group` | string | Type grouping |

---

### **attribute_map**
Maps attributes to entities.

| Column | Type | Description |
|--------|------|-------------|
| `attribute_map_id` | numeric | Primary key |
| `entity_map_id` | numeric | Foreign key to entity_map |
| `change_id` | numeric | Foreign key to changes |
| `attribute_id` | numeric | Foreign key to attribute |

---

### **attribute_map_source**
Source mapping for attributes.

| Column | Type | Description |
|--------|------|-------------|
| `attribute_map_id` | numeric | Primary key/Foreign key |
| `source_attribute_id` | numeric | Source attribute reference |
| `change_id` | numeric | Foreign key to changes |

---

### **entity_attribute_map**
Maps attributes from source to destination entities.

| Column | Type | Description |
|--------|------|-------------|
| `entity_map_id` | numeric | Primary key |
| `source_attribute_id` | numeric | Source attribute |
| `deptype_id` | string | Dependency type |
| `change_id` | numeric | Foreign key to changes |

---

## Entity Mapping

### **entity_map**
Maps relationships between entities.

| Column | Type | Description |
|--------|------|-------------|
| `entity_map_id` | numeric | Primary key |
| `change_id` | numeric | Foreign key to changes |
| `entity_id` | numeric | Foreign key to entity |
| `description` | string | Mapping description |
| `process_id` | numeric | Foreign key to process |

---

## Process Management

### **process**
Defines business processes.

| Column | Type | Description |
|--------|------|-------------|
| `process_id` | numeric | Primary key |
| `change_id` | numeric | Foreign key to changes |
| `process_type` | string | Process type |
| `name` | string | Process name |
| `group_id` | numeric | Foreign key to group |

---

### **process_type**
Types of processes.

| Column | Type | Description |
|--------|------|-------------|
| `code` | string | Type code |
| `description` | string | Type description |

---

## Organizational Structure

### **group**
Organizational groups/teams.

| Column | Type | Description |
|--------|------|-------------|
| `group_id` | numeric | Primary key |
| `name` | string | Group name |
| `parent_group` | numeric | Self-referencing for hierarchy |

---

### **systems**
System definitions.

| Column | Type | Description |
|--------|------|-------------|
| `system_id` | numeric | Primary key |
| `code` | string | System code |
| `name` | string | System name |

---

## Change Tracking

### **changes**
Audit trail for all changes.

| Column | Type | Description |
|--------|------|-------------|
| `change_id` | numeric | Primary key |
| `change_date` | timestamp | When change occurred |
| `change_user` | string | Who made the change |
| `change_name` | string | Change description |
| `appId` | string | Application identifier |

---

## Data Streams

### **streams_space**
Stream/space definitions for data organization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | numeric | Primary key |
| `name_space` | string | Namespace |
| `stream_name` | string | Stream name |

---

## Relationships Summary

- **entities** are organized in **entity_containers** and classified by **entity_type**
- **attributes** describe entity properties and can be mapped through **attribute_map**
- **entity_map** connects entities with processes
- **processes** are categorized by **process_type** and belong to **groups**
- **groups** have hierarchical structure via self-reference
- All modifications tracked through **changes** table
- **systems** provide technical context for containers


**Маппинг JSON DL на таблицы БД DL**

---

| **Поле JSON** |     |     |     |     | **Тип JSON** | **Описание** | **Таблица** | **Поле таблицы** | **Комментарий / Алгоритм/ Условие** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **desc** |     |     |     |     | **object** | **Данные моделей** |     |     |     |
|     | **change_date** |     |     |     | **string** | **Дата версии данных** | **changes** | **change_date** | **Для JSON текущей версии моделей данных - последняя по времени дата в changes.change_date.** |
|     |     |     |     |     |     |     |     |     |     |
| **entities** |     |     |     |     | **object** | **Описание сущностей, которые использовались** |     |     |     |
|     | **id** |     |     |     | **string** | **Уникальное имя сущности в БД** | **entity** | **full_name** |     |
|     | **modified** |     |     |     | **boolean** | **Флаг изменения**<br><br>**true - цель (витрина)**<br><br>**false - источник** | **\-** | **\-** | **Флаг modified заполняется значением = true для всех записей из таблицы entity чьи идентификаторы entity присутствуют в таблице маппинга entity_map.**<br><br>**Остальные записи должны быть с флагом modified = false** |
|     | **type** |     |     |     | **string** | **Тип = table, view, json, input_vector** | **entity** | **entity_type_id** | **Тип сущности type определяется на по идентификатору типа сущности entity_type_id в таблице типов сущностей entity_type. Соответствие типов JSON и в поле entity_type.name**<br><br>**table = TABLE_HIVE**<br><br>**view = VIEW_HIVE**<br><br>**json = JSON**<br><br>**input_vector = INPUT_VECTOR** |
|     | **namespace** |     |     |     | **string** | **Наименование контейнера сущности:**<br><br>**для витрин - схема (БД)**<br><br>**для векторов - модель** | **entity**<br><br>**entity_container** | **entity_container_id**<br><br>**value** | **entities.namespace заполняется значением поля entity_container.value таблицы entiy_container с таким же значением поля идентификатора в entity.entity_container_id**<br><br>**entity_container.entity_container_id = entity.entity_container_id** |
|     | **name** |     |     |     | **string** | **Имя сущности** | **entity** | **name** |     |
|     | **entity_change** |     |     |     | **string** | **Дата изменения сущности в БД** | **entity**<br><br>**change** | **changes.change_id**<br><br>**change_date** | **entity.change_id = changes.change_id** |
|     | **description** |     |     |     | **string** | **Описание сущности** | **entity** | **description** |     |
|     | **container_description** |     |     |     | **string** | **Описание контейнера (БД/модели)** | **entity**<br><br>**entity_container** | **entity_container_id**<br><br>**description** | **entity.entity_container_id = entity_container.entity_container_id** |
|     | **container_change** |     |     |     | **string** | **Дата и время изменения контейнера (его содержания)** | **entity**<br><br>**entity_container**<br><br>**change** | **entity_container_id**<br><br>**change_id**<br><br>**change_date** | **entity.entity_container_id = entity_container.entity_container_id**<br><br>**entity_container.change_id = changes.change_id** |
|     | **attrSeq** |     |     |     | **object** | **Используемые признаки сущностей** |     |     |     |
|     |     | **name** |     |     | **string** | **Имя атрибута (столбца)** | **attribute** | **name** | **В attrSeq.name записывается значение attribute.nameпри условии**<br><br>**attribute.entity_id = entity.entity_id**<br><br>**В БД атрибут привязан к своей сущности (таблице, view) через её идентификатор.** |
|     |     | **type** |     |     | **timestamp/decimal/string/integer** | **Тип данных атрибута (столбца)** | **attribute** | **type_id** | **Значение UpperCase( attribute_type.name ) из справочника типов атрибутов attribute_type при условии:**<br><br>**attribute.type_id = attribute_type.type_id** |
|     |     | **comment** |     |     | **string** | **Комментарий** | **attribute** | **description** |     |
|     |     | **attr_change** |     |     | **string** | **Дата изменения признака** | **attribute**<br><br>**changes** | **change_id**<br><br>**change_date** | **attribute.change_id = changes.change_id** |
| **mappings** |     |     |     |     | **object** | **Информация о маппинге по схеме "источник" - "цель"** |     |     |     |
|     | **entityId** |     |     |     | **string** | **Имя сущности "цель"** | **entity_map**<br><br>**entity** | **entity_id**<br><br>**name** | **Наименование (entity.name) целевой сущности (entity_map.entity_id) из записи таблицы связей entity_map.**<br><br>**entity_map.entity_id = entity.entity_id**<br><br>**В json в массиве сущностей entities**<br><br>**целевые сущности это все entities.id со значением параметра modified = true (см. выше раздел маппинга entities).** |
|     | **process** |     |     |     | **string** | **Наименование процесса DAG** | **entity_map**<br><br>**process** | **process_id**<br><br>**name** | **Значение process заполняется значением из поля process.name при условии entity_map.process_id = process.process_id.**<br><br>**Параметр не обязательный, указывается только для сущностей полученных из JSON автомаппера.** |
|     | **process_description** |     |     |     | **string** | **Описание процесса DAG** | **process** | **description** | **entity_map.process_id = process.process_id**<br><br>**Указывается для источников/витрин из JSON автомаппера** |
|     | **process_change** |     |     |     | **string** | **Дата изменения процесса** | **process**<br><br>**changes** | **change_id**<br><br>**change_date** | **process.change_id = changes.change_id** |
|     | **description** |     |     |     | **string** | **Описание связи (маппинга) источник - цель** | **entity_map** | **description** |     |
|     | **relation_change** |     |     |     | **string** | **Дата добавления/изменения связи** | **entity_map**<br><br>**changes** | **change_id**<br><br>**change_date** | **entity_map.change_id = changes.change_id** |
|     | **deps** |     |     |     | **object** | **Маппинг по схеме атрибут "источник" - атрибут "цель",** |     |     |     |
|     |     |     | **entityId** |     | **string** | **Имя сущности "источник"** | **entity** | **name** | **Имя сущности - источника для целевой сущности mappings.entityId.** |
|     |     |     | **attrMaps** |     | **object** | **Связка атрибут "источник" - атрибут "цель"** |     |     |     |
|     |     |     |     | **src** | **string** | **Имя источника** | **attribute**<br><br>**attribute_map_source** | **name**<br><br>**source_attribute_id** |     |
|     |     |     |     | **dst** | **string** | **Имя таргета** | **attribute**<br><br>**attribute_map** | **name**<br><br>**attribute_id** |     |
|     |     |     |     | **relation_change** | **string** | **Дата добавления/изменения связи** | **attribute_map**<br><br>**changes** | **change_id**<br><br>**change_date** | **attribute_map.change_id = changes.change_id** |
|     |     |     | **atrDeps** |     | **object** | **Атрибуты "источники", которые используются в скрипте** |     |     |     |
|     |     |     |     | **attr** | **string** | **Имя атрибута (признака) источника** | **attribute**<br><br>**entity_attribute_map** | **name**<br><br>**source_attribute_id** | **В atrDeps.attr записывается наименование атрибута attribute.name по идентификатору атрибута entity_attribute_map.source_attribute_id = attribute.attribute_id** |
|     |     |     |     | **linkTypes** | **string** | **Для какой функции используется данный атрибут** | **entity_attribute_map** | **deptype_id** | **В массив linkTypes записываются все значения функций атрибута attr (entity_attribute_map.source_attribute_id) из поля entity_attribute_map.deptype_id. Для этого требуется сгруппировать записи в entity_attribute_map по идентификатору атрибута источника entity_attribute_map.source_attribute_id.** |
|     |     |     |     | **relation_change** | **string** | **Дата добавления/изменения связи** | **entity_attribute_map**<br><br>**changes** | **change_id**<br><br>**change_date** | **entity_attribute_map.change_id = changes.change_id** |

Синим цветом в таблице выделены различия (атрибуты, типы и т.п.) расширенной версии JSON от версии JSON автомаппера.

**Алгоритм преобразования РБД в JSON**

**Заголовок desc**

1\. В заголовке JSON требуется записать последнюю по времени дату changes.change_date из таблицы учёта изменений changes.

1\. **Массив объектов entities**

2\. В массив объектов entities требуется записать согласно маппингу все сущности из таблицы entity и их свойства (тип сущности, источник/цель ), а так же их атрибуты из таблицы attribute в массив entity.attrSeq. В первую очередь записываются целевые сущности (витрины) со значением modified = true, это записи из таблицы entity чьи идентификаторы entity присутствуют в таблице маппинга entity_map, затем все остальные сущности- источники со значением modified = false.

2\. **Массив маппинга атрибутов mappings**

3\. Необходимо сформировать массив **mappings** из объектов маппинга согласно таблице маппинга. Для каждой записи таблицы связей entity_map требуется сформировать объект массива **mappings.** Каждый объект массива **mappings** содержит уникальное наименование целевой сущности **mappings.entityId** (берётся entity.name по entity_map.entity_id ), информацию о процессе (для данных из json автомаппера), описание связи, время изменения, массив объектов **mappings.deps** содержащих имя источника **mappings.entityId** и в объектах массива **attrMaps** связи атрибутов источника и атрибутов целевой сущности, а та жемассив объектов **atrDeps** с информацией о функциональных связях (SQL- функции атрибутов источников).

3\. **Объекты связи массива mappings.deps**

3\. 3.1. Для целевой сущности **mappings.entityId** из записи связи требуется отобрать все связи её атрибутов в таблице связей атрибутов **atribute_map** по идентификатору связи **entity_map_id,** где **atribute_map.attribute_id** это идентификатором атрибута этой целевой сущности ( наименование атрибута цели attrMaps.dest = attribute.name с этим идентификатором)**,** и в таблице связей атрибутов источников **atribute_map_source** по идентификатору связи атрибутов **attribute_map_id** находится идентификатор атрибута источника **source_attribute_id**. Все связи каждой целевой сущности необходимо сгруппировать по источникам (источник определяется по связям его атрибутов **atribute_map_source.source_attribute_id = attribute.attribute_id и attribute.entity_id = entity.entity_id)** и для каждого такого источника в json создать отдельный объект в котором прописать его имя в **deps.entityId** и добавить два массива атрибутов:

3\. 3.1.1. Массив объектов маппинга атрибутов **attrMaps** источник (**attrMaps.src**) - цель (**attrMaps.dst**) по записям таблиц связей атрибутов **attribute_map** и **atribute_map_source.**

3\. 3.1.2. Массив объектов функций атрибутов **atrDeps** по записям таблицы **entity_attribute_map.**