import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Logger
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, QueryRunner, IsNull } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { JsonCommitEntity } from "../entities/json-commit.entity";
import { JsonCommitSaveRequestDto } from "../dto";

@Injectable()
export class JsonCommitService {
    private readonly logger = new Logger(JsonCommitService.name);

    constructor(
        @InjectRepository(JsonCommitEntity)
        private readonly commitRepository: Repository<JsonCommitEntity>,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Получение всех коммитов во всех статусах
     */
    async getAllCommits(): Promise<JsonCommitEntity[]> {
        try {
            const commits = await this.commitRepository.find({
                order: { timestamp: "DESC" }
            });

            this.logger.log(`Получено ${commits.length} коммитов`);
            return commits;
        } catch (error) {
            this.logger.error(`Ошибка при получении коммитов: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при получении коммитов");
        }
    }

    /**
     * Получение коммита по ID
     */
    async getCommitById(commitId: string): Promise<JsonCommitEntity> {
        try {
            const commit = await this.commitRepository.findOne({
                where: { commit_id: commitId }
            });

            if (!commit) {
                throw new NotFoundException(`Коммит с ID ${commitId} не найден`);
            }

            return commit;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Ошибка при получении коммита ${commitId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при получении коммита");
        }
    }

    /**
     * Сохранение коммита (оригинала или пользовательской версии)
     */
    async saveCommit(saveDto: JsonCommitSaveRequestDto): Promise<JsonCommitEntity> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (!saveDto.commit_id) {
                // Сохранение оригинала коммита - создаем две записи
                return await this.saveOriginalCommit(saveDto, queryRunner);
            } else {
                // Сохранение пользовательской версии коммита
                return await this.saveUserVersionCommit(saveDto, queryRunner);
            }
        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            this.logger.error(`Ошибка при сохранении коммита: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при сохранении коммита");
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Сохранение оригинала коммита - создает две записи
     */
    private async saveOriginalCommit(
        saveDto: JsonCommitSaveRequestDto,
        queryRunner: QueryRunner
    ): Promise<JsonCommitEntity> {
        this.logger.log("Создание оригинала коммита");

        // 1. Создаем запись оригинала
        const originalCommit = new JsonCommitEntity();
        originalCommit.commit_id = uuidv4();
        originalCommit.timestamp = new Date(saveDto.timestamp || new Date());
        originalCommit.user = saveDto.user;
        originalCommit.parent_id = null;
        originalCommit.commit_name = saveDto.commit_name;
        originalCommit.commit_description = saveDto.commit_description || null;
        originalCommit.state = "processing";
        originalCommit.commit = null; // Согласно документации: поле с json коммита не заполняется
        originalCommit.type = saveDto.type;

        const savedOriginal = await queryRunner.manager.save(JsonCommitEntity, originalCommit);
        this.logger.log(`Создан оригинал коммита: ${savedOriginal.commit_id}`);

        // 2. Создаем пользовательскую версию
        const userCommit = new JsonCommitEntity();
        userCommit.commit_id = uuidv4();
        userCommit.timestamp = new Date(saveDto.timestamp || new Date());
        userCommit.user = saveDto.user;
        userCommit.parent_id = savedOriginal.commit_id;
        userCommit.commit_name = saveDto.commit_name;
        userCommit.commit_description = saveDto.commit_description || null;
        userCommit.state = "processing";
        userCommit.commit = saveDto.commit || null; // Копия оригинала или null
        userCommit.type = saveDto.type;

        const savedUserCommit = await queryRunner.manager.save(JsonCommitEntity, userCommit);

        await queryRunner.commitTransaction();
        this.logger.log(`Создана пользовательская версия коммита: ${savedUserCommit.commit_id}`);

        return savedUserCommit;
    }

    /**
     * Сохранение пользовательской версии коммита
     */
    private async saveUserVersionCommit(
        saveDto: JsonCommitSaveRequestDto,
        queryRunner: QueryRunner
    ): Promise<JsonCommitEntity> {
        this.logger.log(`Обновление пользовательской версии коммита: ${saveDto.commit_id}`);

        // Находим существующую пользовательскую версию
        const userCommit = await queryRunner.manager.findOne(JsonCommitEntity, {
            where: { commit_id: saveDto.commit_id }
        });

        if (!userCommit) {
            throw new NotFoundException(`Пользовательская версия коммита с ID ${saveDto.commit_id} не найдена`);
        }

        // Проверяем, можно ли редактировать коммит
        if (userCommit.state === "done") {
            throw new BadRequestException("Коммиты в статусе 'done' редактировать нельзя");
        }

        // Проверяем, что это не оригинал
        if (userCommit.parent_id === null) {
            throw new BadRequestException("Нельзя редактировать оригинальный коммит");
        }

        // Обновляем данные
        userCommit.timestamp = new Date(saveDto.timestamp || new Date());
        userCommit.user = saveDto.user;
        userCommit.commit_name = saveDto.commit_name;
        userCommit.commit_description = saveDto.commit_description || userCommit.commit_description;

        // Обновляем parent_id если передан
        if (saveDto.parent_id !== undefined) {
            userCommit.parent_id = saveDto.parent_id;
        }

        // Обновляем JSON только если он передан
        if (saveDto.commit !== undefined) {
            userCommit.commit = saveDto.commit;
        }

        // Тип коммита не меняется при обновлении пользовательской версии
        const updatedCommit = await queryRunner.manager.save(JsonCommitEntity, userCommit);

        await queryRunner.commitTransaction();
        this.logger.log(`Коммит обновлен: ${updatedCommit.commit_id}`);

        return updatedCommit;
    }

    /**
     * Смена статуса коммита на "done"
     */
    async updateCommitStatus(): Promise<{ updated: number }> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Находим все коммиты в статусе processing
            const processingCommits = await queryRunner.manager.find(JsonCommitEntity, {
                where: { state: "processing" }
            });

            if (processingCommits.length === 0) {
                await queryRunner.commitTransaction();
                return { updated: 0 };
            }

            // Обновляем статус на done
            const updatePromises = processingCommits.map(commit => {
                commit.state = "done";
                commit.updated_at = new Date();
                return queryRunner.manager.save(JsonCommitEntity, commit);
            });

            await Promise.all(updatePromises);
            await queryRunner.commitTransaction();

            const updatedCount = processingCommits.length;
            this.logger.log(`Обновлено статусов коммитов: ${updatedCount}`);

            return { updated: updatedCount };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Ошибка при обновлении статусов коммитов: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при обновлении статусов коммитов");
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Получение коммитов по родительскому ID (оригинал + пользовательские версии)
     */
    async getCommitsByParent(parentId: string): Promise<JsonCommitEntity[]> {
        try {
            // Получаем оригинал
            const originalCommit = await this.commitRepository.findOne({
                where: { commit_id: parentId, parent_id: IsNull() }
            });

            // Получаем все пользовательские версии
            const userCommits = await this.commitRepository.find({
                where: { parent_id: parentId },
                order: { timestamp: "DESC" }
            });

            // Объединяем результаты
            const commits: JsonCommitEntity[] = [];
            if (originalCommit) {
                commits.push(originalCommit);
            }
            if (userCommits.length > 0) {
                commits.push(...userCommits);
            }

            return commits;
        } catch (error) {
            this.logger.error(`Ошибка при получении коммитов по родителю ${parentId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при получении коммитов");
        }
    }

    /**
     * Удаление коммита (только пользовательских версий)
     */
    async deleteCommit(commitId: string): Promise<{ deleted: boolean }> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Находим коммит
            const commit = await queryRunner.manager.findOne(JsonCommitEntity, {
                where: { commit_id: commitId }
            });

            if (!commit) {
                throw new NotFoundException(`Коммит с ID ${commitId} не найден`);
            }

            // Проверяем, что это не оригинал
            if (commit.parent_id === null) {
                throw new BadRequestException("Нельзя удалить оригинальный коммит");
            }

            // Проверяем статус
            if (commit.state === "done") {
                throw new BadRequestException("Нельзя удалить коммит в статусе 'done'");
            }

            // Удаляем коммит
            await queryRunner.manager.remove(JsonCommitEntity, commit);
            await queryRunner.commitTransaction();

            this.logger.log(`Коммит удален: ${commitId}`);
            return { deleted: true };
        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            this.logger.error(`Ошибка при удалении коммита ${commitId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при удалении коммита");
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Получение коммитов по типу
     */
    async getCommitsByType(type: "table" | "json" | "model"): Promise<JsonCommitEntity[]> {
        try {
            const commits = await this.commitRepository.find({
                where: { type },
                order: { timestamp: "DESC" }
            });

            return commits;
        } catch (error) {
            this.logger.error(`Ошибка при получении коммитов по типу ${type}: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при получении коммитов");
        }
    }

    /**
     * Получение коммитов по пользователю
     */
    async getCommitsByUser(user: string): Promise<JsonCommitEntity[]> {
        try {
            const commits = await this.commitRepository.find({
                where: { user },
                order: { timestamp: "DESC" }
            });

            return commits;
        } catch (error) {
            this.logger.error(`Ошибка при получении коммитов пользователя ${user}: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при получении коммитов");
        }
    }

    /**
     * Получение оригинальных коммитов (с parent_id = null)
     */
    async getOriginalCommits(): Promise<JsonCommitEntity[]> {
        try {
            return await this.commitRepository.find({
                where: { parent_id: IsNull() },
                order: { timestamp: "DESC" }
            });
        } catch (error) {
            this.logger.error(`Ошибка при получении оригинальных коммитов: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при получении оригинальных коммитов");
        }
    }

    /**
     * Получение коммитов в статусе processing
     */
    async getProcessingCommits(): Promise<JsonCommitEntity[]> {
        try {
            return await this.commitRepository.find({
                where: { state: "processing" },
                order: { timestamp: "DESC" }
            });
        } catch (error) {
            this.logger.error(`Ошибка при получении коммитов в обработке: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при получении коммитов в обработке");
        }
    }

    /**
     * Получение коммитов в статусе done
     */
    async getDoneCommits(): Promise<JsonCommitEntity[]> {
        try {
            return await this.commitRepository.find({
                where: { state: "done" },
                order: { timestamp: "DESC" }
            });
        } catch (error) {
            this.logger.error(`Ошибка при получении выполненных коммитов: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при получении выполненных коммитов");
        }
    }

    /**
     * Получение пользовательских версий коммита по оригиналу
     */
    async getUserVersionsByOriginal(originalId: string): Promise<JsonCommitEntity[]> {
        try {
            return await this.commitRepository.find({
                where: { parent_id: originalId },
                order: { timestamp: "DESC" }
            });
        } catch (error) {
            this.logger.error(`Ошибка при получении пользовательских версий для оригинала ${originalId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException("Ошибка при получении пользовательских версий");
        }
    }
}