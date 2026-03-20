# Semantic Versioning Changelog

# [1.8.0](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.7.1...v1.8.0) (2026-03-20)


### Bug Fixes

* lint fix ([f986bac](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/f986bac7fe1d20c71dc360f58b6d01f33dffb225))


### Features

* Добавил пермишены для работы с коммитами ([e2f8b02](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/e2f8b02f251c51fc2405c77859c416be0466b38f))
* Добавил пермишены для работы с коммитами ([5a7938c](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/5a7938c1996f5bf57e8f16761096cba319fb2e72))

## [1.7.1](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.7.0...v1.7.1) (2026-03-18)


### Bug Fixes

* **merge:** дедупликация JSON и БД теперь выполняется последовательно, сообщение о JSON-дедупликации сохраняется ([06cfb5e](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/06cfb5e16bb94158f72704ad60687cee126f3116))

# [1.7.0](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.6.0...v1.7.0) (2026-03-18)


### Bug Fixes

* **dedup:** группировка по name+entity_container_id, валидация в try-catch ([51630d0](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/51630d08aa1149d629a87b02bbbaa921b7ef4ed9))
* **dedup:** группировка по name+namespace+system_code, apply без 400 ([66c8df4](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/66c8df492d201a0315a14ce7fad4d4620f596df1))
* **entities:** унификация entity composite id — extractFullName во всех сервисах ([501be93](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/501be93c25a054ae72812dd830a4020b7780b346))
* **merge:** автоматическая дедупликация при обнаружении дубликатов в applyMerge ([02c0574](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/02c057409b2a7bf9957f3b1a9a520386249cddc0))
* **merge:** полная валидация merged JSON в applyMerge — 1:1 с hasCriticalErrors ([c2a7cb1](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/c2a7cb14becef0c5fb23d41c7603f685ecfeeb4f))
* **merge:** проверка дубликатов по merged JSON вместо БД + улучшения CORS и toast сообщений ([1715a16](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/1715a1604a929f3e8aa16774365cf9a36ce10669))
* **merge:** убраны лишние вызовы handleApply после дедупликации ([8baf7f0](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/8baf7f0002a7f654ab79db5b750afb622de6d272))
* **ui:** загрузка полного payload коммита через useS2tCommitById + отключение staleTime для актуальности данных ([46d0d4a](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/46d0d4a381b7eb6eedb031235ae3132bd5040fc9))


### Features

* добавлено поле file_name для предотвращения дублирования коммитов по имени файла ([c694ccd](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/c694ccd2a4bf277fe91791c0284f13ca1ce03a44))
* **backend:** оптимизация merge performance через incremental apply ([e2d0b7f](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/e2d0b7f9f6a310cfbab90421a459932701ea2bc2))
* **merge:** дедупликация merged JSON в кеше перед применением + автоматический перезапуск preview после dedup ([aa57826](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/aa5782638a6685dda3f7ba0f4c74482589dd5089))
* **merge:** дедупликация сущностей в БД + безопасный confirm ([8965886](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/89658860eec6dbc0c964a36d1b50cc2fa5c6814f))

# [1.6.0](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.5.1...v1.6.0) (2026-03-11)


### Bug Fixes

* push limits ([44bdda2](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/44bdda27fb512ded9d582bb9847fc56c6851491c))
* push limits ([204cbfa](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/204cbfa9536de3025de9d78b84ef6863ab061c52))
* validation logs added ([d4404a6](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/d4404a68615d83183d49bef0c26e4fabb6ce7892))
* добавлены типы, статусы коммитов и колбэки для отслеживания прогресса импорта ([c050e3f](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/c050e3fa479cac5853f0fa1348001c833c126121))
* Изменил генерацию uuid ([b9f3717](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/b9f371705fe2ec1d4970c12caa332bfba92ddb08))
* оптимизация памяти и производительности для работы с большими моделями ([de3952e](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/de3952e0fbb318e889d7963db53fe14070eb4e48))


### Features

* добавлены расширенные фильтры для экспорта сущностей и улучшен просмотр диффов ([666666a](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/666666ac2ac3bc5a35abe8abd9c7967d70010e78))

## [1.5.1](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.5.0...v1.5.1) (2026-03-06)


### Bug Fixes

* version fix ([b24b08f](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/b24b08f43f3acaf923b5df43dfc2416aceb68695))

# [1.5.0](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.4.1...v1.5.0) (2026-03-06)


### Bug Fixes

* version fix ([889a618](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/889a618125d1b9206e71b5579b9792d016e55c4e))
* version fix ([5508f95](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/5508f95454cf08913bc82a6e29d1d1d7645c7390))
* исправлен порядок нод в графе моделей и добавлены иконки типов ([86b0d0b](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/86b0d0be535d19a170a7da1e4f2abd264696e9bc))
* Поправил работу mergeservice ([62257dd](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/62257ddd56656c728810c4108853506abfd7c6bd))
* Поправил работу mergeservice ([5c20d3c](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/5c20d3c52f4c32f6d9ef5c251be32e7ef4fb059f))
* Поправил работу маппингов ([de75978](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/de75978ef3dedf9b69f42b84e24cd41db5911059))
* увеличены расстояния между нодами в графе моделей ([6ef78ab](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/6ef78ab9fbc9c010e08b9c4a81243284430269c9))


### Features

* использование userStore для автора коммита вместо authStore ([b9af8ac](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/b9af8ac66c2e13f1e0076e9b3ffed429e21d4cbc))
* упрощение импорта S2T — конвертация и валидация на беке ([89ada77](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/89ada77fb0d6b5bf7338fba30623dcb202fedc2c))

## [1.4.1](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.4.0...v1.4.1) (2026-03-04)


### Bug Fixes

* search fixes ([5b6be96](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/5b6be96d8038467697eb88c4a6ad75d2954f403c))
* search fixes ([6ec71c7](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/6ec71c727037907d72ae59a93cfbf23b65f39603))

# [1.4.0](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.3.3...v1.4.0) (2026-03-04)


### Bug Fixes

* css fixes ([ae2938a](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/ae2938af0ba87240192e164d08d951b998a81607))
* css fixes ([42b5f52](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/42b5f52bf226e5b60c4a3ba429522989a31d625a))
* search fixes ([23b7340](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/23b73405574d71ff7701cd6d4b0fc8ea219b2de2))
* добавить раскрытие атрибутов при поиске в EntityPreviewPage и ModelPreviewPage ([52733cb](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/52733cbab9e4b93230eff3ec7405145e2dcb7199))
* изолировать поиск EntityPreviewPage и ModelPreviewPage от глобального стора дашборда ([f8a9252](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/f8a9252241de02a32c96705fcf37460bba77b10f))
* Поправил валидацию ([b7b6604](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/b7b660434444e5475316a300fc88c6549dda4eb0))
* скрытие entity-связей при выборе атрибутов и замена иконки очистки на Clear ([1f5b958](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/1f5b958ffcafd6ed7deb882314593063524c04d4))
* улучшена логика парсинга схемы и таблицы в S2T экспорте и удалена колонка localStorage из настроек ([fec88fc](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/fec88fc6c24d22bc4e06e211ac2457c1969e79b3))


### Features

* добавлена персистентность состояния AG Grid таблиц ([63a3c62](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/63a3c62baaee323f37bca2a3b43875c4f68a9d82))

## [1.3.3](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.3.2...v1.3.3) (2026-03-02)


### Bug Fixes

* css fixes ([c281a49](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/c281a493c6d721814cffa41f4fff3571c545419d))
* css fixes ([72ebb61](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/72ebb61d18e4db6966d965f61a9242625181f963))
* mem fixes ([0560218](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/05602181d59c781654522bd20838c7a292a6a49f))
* mem fixes ([dcb49da](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/dcb49da111b882eef208b5c59d6bde2f1c26b076))
* mem fixes ([afbeed9](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/afbeed96ccb960262f50767908c7a424424e643d))
* Поправил constraint ([70830d6](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/70830d6e8bc4cb73edb919e36578b23dc1bf24be))
* Поправил s2t-converter ([98e50f7](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/98e50f72d221c690ba82a45510cfe15280172f6a))

## [1.3.2](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.3.1...v1.3.2) (2026-02-27)


### Bug Fixes

* loader fix ([dac8b6c](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/dac8b6cc7ca1956da63a952438ffa7b3f147f758))

## [1.3.1](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.3.0...v1.3.1) (2026-02-26)

# [1.3.0](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.2.0...v1.3.0) (2026-02-18)


### Bug Fixes

* fetch error fix ([cbf2cc2](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/cbf2cc2493032a8100ab4de3166a5cf94701a734))
* fetch error fix ([7e93635](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/7e93635afb217952a0d5811f647ac763a32117aa))
* wip ([1bde17b](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/1bde17bfc8f77910e5c221ecc267a5b9a728391f))


### Features

* Добавил S2T, мердж и дифф ([36febeb](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/36febeba092bab7a23223d3bd41dfef86d5be0e0))
* добавлен API для получения release notes и отображение версии в настройках ([6b5792a](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/6b5792a9f70e5ccd0757e94e72c2af7986107871))
* добавлен индикатор загрузки основных данных в Header и улучшена логика отображения загрузки в MainLayout ([bcc0fa1](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/bcc0fa161b2b54b32332e91bda662963c11d5e61))
* Поправил S2T, дифф ([18d4d1a](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/18d4d1a8484de9eb2585b0aff1071d3bd42ed0ea))
* фоновая загрузка всего json и поиск по сущностям ([c8f67b7](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/c8f67b76ebe51a429c138bb447ea7ed58602edc2))

# [1.2.0](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.1.2...v1.2.0) (2026-02-12)


### Bug Fixes

* add ARG for base image ([ece255b](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/ece255b32c57e698870f32b738372b0d3abcb4e1))
* добавил дефолтную систему и сделал system_id обязательным полем ([a7c2a41](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/a7c2a413088a258c6e709645da49fccba940eaf1))
* Добавил кэш для экспорта ([1340e80](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/1340e80b5b8a5c977959d26e9a8b4020cd0e19a5))
* добавил логи и метрики для кэша ([86b2051](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/86b2051cd497c9a7cf5e0c7642b2e0538bc78771))
* Добавил получение зависимостей ([6801732](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/6801732172650137f8d2127f604cd4e9db5c83b0))
* добавил ресурсы ([71bf170](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/71bf170845d2674ae2e3ffde8c139cb56e165b5e))
* исправлена логика работы с настройками панелей в panelSettingsStore ([60bfb84](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/60bfb844c4221d0d906df49f7a799de3d5632631))
* Мерж-коммит изменений из dev ([b3a43c4](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/b3a43c4ff02bd0d43a14e2d9e4fbbb13bf55f94c))
* Поправил deps ([6d4a10b](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/6d4a10b2d15683e4dc24bcb06d6b6d3f012d8115))
* поправил работу ноды модели на графе ([21792f9](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/21792f996bebf4538c22d1f34b603c826a605951))
* поправил реализацию валидации ([742b377](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/742b377f00ea8d456fa15949afdb91757b338e1a))
* Поправил экспорт ([66d2dd5](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/66d2dd5efd5600f9dba4a2447f76188702fbd21b))
* установка дефолтного system_id для существующих записей перед добавлением NOT NULL constraint ([c8401b4](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/c8401b4e3a8223731ba52fbbba14f189953b7c79))


### Features

* добавил view и поля в json ([ebabbd1](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/ebabbd1ee992f1c17df866a83c9b8c886214fa17))
* добавил коммиты и system_code ([f3361b9](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/f3361b9477c052908007c79107d6e196f16141e1))
* добавил миграцию ([02ed059](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/02ed059d5918b97c05dc3ab6b60bfc3cbe132b0a))
* добавлен API для процессов и S2T коммитов с интеграцией в UI ([da87af6](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/da87af64ecd07a56d44a780474a6d44ddb478ec0))
* добавлен UI для отслеживания и применения S2T коммитов в Header и Dashboard ([d0c4431](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/d0c4431d32bb307abe3aebe67c69e2987ee0e0de))
* добавлена конвертация S2T файлов в JSON и commit JSON, UI ([f6ee181](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/f6ee18147d2fd63ecdc095e89afc784a0b62674a))
* добавлена таблица s2t_commits для хранения коммитов S2T и API для работы с ними ([17e1dcc](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/17e1dccf3afa3f33496b4d639e0600c9bd6d3294))
* добавлено отображение короткого хеша коммита в боковом меню ([e96056f](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/e96056f983a0c25ef57d9a563b9ec370143060e3))
* использование данных с рбд ([b8a183f](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/b8a183f50968eca00ee0e80ecd08cacd369d1ebc))
* использование данных с рбд ([b2e64d8](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/b2e64d815547ee2c57701032e2feab3e4371ff96))


### Reverts

* отмена обязательности поля system_id в entity_container ([a85e0d8](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/a85e0d8c370c290f3d2f6447d0eee62bb2797bf8))

## [1.1.2](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.1.1...v1.1.2) (2025-12-29)


### Bug Fixes

* Удалил лишнии миграции ([d6a0ae5](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/d6a0ae5d36aedd0079bdb80f72d390f1513f4c88))

## [1.1.1](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.1.0...v1.1.1) (2025-12-25)


### Bug Fixes

* Поправил constraints ([e84f87a](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/e84f87abf32e19c70eade50c81ec1605d94e6071))

# [1.1.0](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.0.2...v1.1.0) (2025-12-22)


### Features

* add description column to process table and enhance data lineage entity attributes ([9708e96](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/9708e96fcaf58149bb00c03de7d5bbb3339e0b40))
* show deps for datamart select ([82f682a](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/82f682ab4399d5cf4bb69dfe6eccc71de7a737bc))
* Добавил exportJsonDL ([57ebd17](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/57ebd17e26ee46e116e33d1a75b750f20262629a))
* Добавил остальные сущности ([689652b](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/689652bf9a866b58947affa8657f0325e83d3bf3))
* Добавил остальные сущности ([2490d0c](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/2490d0c5c6703cb037d17b7b65b77c961dc069eb))
* Поправил загрузку env ([ab2f107](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/ab2f107c664050eed55f798e6520d76d54d7b99a))
* Поправил загрузку конфига для бд ([8cadb21](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/8cadb218dbe14cae73e53775590bc1a808708a7a))
* Поправил миграции ([59526f2](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/59526f2c6cdc9354af77f2d081c137e3c755f84d))
* Поправил обработку ошибок ([7984c7c](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/7984c7ca027f15f0a900f1752630b9e7ff3da492))
* Рефакторинг импорта и валидации JSON ([1db97fa](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/1db97fa942fb64ae8d6000ac165626ed7b22b292))
* Рефакториннг JsonMappingService ([6ff2220](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/6ff2220546d2a3cd35967931f61177464c49405a))
* Рефакториннг JsonMappingService ([3255fcb](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/3255fcb84376ae772a7332f44c7776b57b2da2bf))
* Убрал дублирование валидации JSON ([a6e4897](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/a6e4897c2352bced5e9785a62b4da8b4195f888a))

## [1.0.1](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/compare/v1.0.0...v1.0.1) (2025-12-18)


### Bug Fixes

* ts fix shared ([a9dc1e4](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/a9dc1e4ce6afeebb5c1ca88c682628a9727ab256))
* ts fix shared ([9ebaee7](https://git.sfera.inno.local:7999/SUMD/data_lineage_monorepo/commit/9ebaee7ac969808afdb818735a0d12f930e3763e))
