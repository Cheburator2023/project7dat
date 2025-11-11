<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

https://sfera.inno.local/sourcecode/projects/SUMD/repos/npm_deps_collection/code/browse/branch/master 
Зависимости добавлять/сравнить с эталоном

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

NestJS сервер для управления графами линейности данных. В режиме разработки и продакшене используется только PostgreSQL.

## Особенности

- **Единая БД**: Во всех окружениях используется PostgreSQL
- **Type-safe API**: Zod схемы для валидации данных
- **JSONB поддержка**: Нативная поддержка JSONB типов в PostgreSQL
- **REST API**: CRUD операции для JSON документов
- **Swagger**: Документация доступна по пути `/api/docs`

## API Endpoints

- `POST /api/json-data` - Создание JSON документа
- `GET /api/json-data` - Получение списка с пагинацией и поиском
- `GET /api/json-data/:id` - Получение по ID
- `PUT /api/json-data/:id` - Обновление
- `DELETE /api/json-data/:id` - Удаление
- `GET /api/health` - Проверка состояния сервера

## Переменные окружения

Создайте файл `.env.development` в папке `apps/nestjs-server/` со следующими значениями для локальной разработки:

```env
# Общие
NODE_ENV=development
PORT=3000

# База данных (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=data_lineage

# Настройки ORM
DB_SYNCHRONIZE=true
DB_LOGGING=true
# Автозапуск миграций на старте (включайте по необходимости)
DB_MIGRATIONS_RUN=false

# God mode (отключает проверку ролей в dev)
NO_ROLES=true
```

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# Установка зависимостей (в корне монорепозитория)
$ npm install

# Запуск только NestJS сервера (в корне монорепозитория)
$ npm run dev:server:nest

# Альтернатива: из папки приложения
$ cd apps/nestjs-server
$ npm run dev           # стандартный режим
$ npm run dev:god       # dev с отключением ролей (NO_ROLES=true)

# Production (после сборки)
$ npm run prod
```

## Database Management (PostgreSQL)

```bash
# Из корня монорепозитория
$ npm run db:reset              # сброс dev базы и данных (локально)
$ npm run db:reset:dev:restart  # сброс dev базы и перезапуск dev серверов

# Из папки apps/nestjs-server
$ npm run migration:run         # запуск миграций (использует src/core/config/ormconfig.ts)
$ npm run migration:revert      # откат миграций
$ npm run migration:generate --name=InitialSchema
```

**⚠️ Важно**:
- Используйте только локальный PostgreSQL для разработки. Никогда не указывайте переменные на удаленные БД для операций сброса/миграций.
- `DB_SYNCHRONIZE=true` удобно для dev, но в продакшене рекомендуем `false` и использовать миграции.

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
