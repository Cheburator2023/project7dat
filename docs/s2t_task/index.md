Цель - Пользователь хочет загрузить происшедшие  изменения  источниках и витринах, просмотреть их и обновить данные РБД DL. Нужно настроить импорт/экспорт в формате s2t. Описание процессов находятся в docx файлах в папке docs/s2t_task/docx. примеры s2t находятся в папке docs/s2t_task/s2t_files_examples

Предусловия - Пользователь находится в главном окне GUI  DL и выбирает раздел меню Импорт данных (коммиты).

Предпосылки кода - система в режиме alpha. есть старые mvp эндпоинты которые работают как пример:

JSON Данные
CRUD операции для JSON документов
POST
/api/json-data/create
Создать новый JSON документ
GET
/api/json-data/list
Получить список JSON документов
GET
/api/json-data/current
Получить последний JSON документ
GET
/api/json-data/{id}
Получить JSON документ по ID
PUT
/api/json-data/update/{id}
Обновить JSON документ
PUT
/api/json-data/{id}/version
Обновить информацию о версии JSON документа
GET
/api/json-data/{id}/history
Получить историю изменений документа
DELETE
/api/json-data/delete/{id}
Удалить JSON документ
POST
/api/json-data/set-current/{id}
Установить текущий JSON документ по ID
POST
/api/json-data/set-current-from-snapshot/{snapshotId}
Установить текущий JSON документ из снимка
POST
/api/json-data/reset
Сбросить все данные базы (только для тестирования)JSON Коммиты
Управление версиями JSON документов
POST
/api/json-commits/initialize
Инициализировать новый JSON с данными
POST
/api/json-commits/commit
Коммит текущего JSONа
PUT
/api/json-commits/{id}/status
Обновить статус коммита
GET
/api/json-commits/queue
Получить очередь коммитов
POST
/api/json-commits/commit/{id}
Обновить JSON с коммитом
GET
/api/json-commits/commits
Получить список коммитов
GET
/api/json-commits/commits/all
Получить все коммиты из всех JSON данных
GET
/api/json-commits/commits/search/{id}
Поиск коммитов по JSONу
GET
/api/json-commits/commits/{id}
Получить коммит по ID
GET
/api/json-commits/commits/{id}/cumulative
Получить кумулятивные данные до указанного коммита
POST
/api/json-commits/commits/{id}/apply
Применить коммит к JSON данным

POST
/api/json-commits/commits/{id}/apply-partial
Частично применить коммит к JSON данным


Актуальные эндпоинты (на который будет реально работать приложение):

Импорт JSON


POST
/api/json-import/surm
Импорт JSON СУРМ в БД DL



POST
/api/json-import/dapp
Импорт JSON DAPP в БД DL



POST
/api/json-import/validate-comprehensive
Комплексная валидация JSON перед импортом


Валидация JSON


POST
/api/json-validation/validate
Предварительная валидация JSON перед импортом



POST
/api/json-validation/check-dependencies
Проверка зависимостей сущностей


Экспорт JSON


GET
/api/json-export/dl
Экспорт данных РБД в JSON DL



GET
/api/json-export/dl/change/{changeId}
Экспорт данных РБД в JSON DL по change_id