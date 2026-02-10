import {
    BadRequestException,
    Injectable,
    NotFoundException,
    Optional,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { JsonDataEntity } from "../entities/json-data.entity";
import {
    CreateJsonDataInput,
    GetJsonDataListInput,
    UpdateJsonDataInput,
} from "../schemas/json-data.schema";
import { CommitJsonDataInput } from "../schemas/json-commit.schema";
import { JsonCommitService } from "./json-commit.service";
import { ChangelogService } from "../../changelog/services/changelog.service";
import { ChangelogMemoryStorageService } from "../../changelog/services/changelog-memory-storage.service";
import { SnapshotEntity } from "../../snapshots/entities/snapshot.entity";
import { VersionInfoDto } from "../dto/version-info.dto";
import { JsonCommitEntity } from "../entities/json-commit.entity";

@Injectable()
export class JsonDataService {
    constructor(
        @Optional()
        @InjectRepository(JsonDataEntity)
        private readonly jsonDataRepository: Repository<JsonDataEntity>,
        @Optional()
        @InjectRepository(JsonCommitEntity)
        private readonly commitRepository: Repository<JsonCommitEntity>,
        @Optional()
        @InjectRepository(SnapshotEntity)
        private readonly snapshotRepository: Repository<SnapshotEntity>,
        readonly _configService: ConfigService,
        private readonly jsonCommitService: JsonCommitService,
        private readonly changelogService: ChangelogService,
        private readonly changelogMemoryStorage: ChangelogMemoryStorageService,
    ) {}

    async createGraphData(
        input: CreateJsonDataInput & { authorName?: string },
    ): Promise<any> {
        const name = input.name || `JSON ${new Date().toLocaleString("ru-RU")}`;
        const description = input.description || "Инициализация json данных";
        const version = input.version || "1.0.0";

        const jsonData = this.jsonDataRepository.create({
            id: uuidv4(),
            name,
            data: input.data,
            description,
            version,
            authorName: input.authorName || "System",
            isCurrent: false,
        });
        const result = await this.jsonDataRepository.save(jsonData);

        await this.changelogService.logGraphCreated(result.id, result.name);
        return result;
    }

    async createDataWithId(
        id: string,
        input: CreateJsonDataInput & { authorName?: string },
    ): Promise<any> {
        const name = input.name || `JSON ${new Date().toLocaleString("ru-RU")}`;
        const description = input.description || "Инициализация json данных";
        const version = input.version || "1.0.0";

        const jsonData = this.jsonDataRepository.create({
            id,
            name,
            data: input.data,
            description,
            version,
            authorName: input.authorName || "System",
            isCurrent: false,
        });
        return this.jsonDataRepository.save(jsonData);
    }

    async getAllGraphsWithPagination(
        input: GetJsonDataListInput,
    ): Promise<{ data: any[]; total: number }> {
        const { page, limit, search } = input;
        const skip = (page - 1) * limit;

        const whereCondition = search
            ? [{ name: Like(`%${search}%`) }, { description: Like(`%${search}%`) }]
            : {};

        const [data, total] = await this.jsonDataRepository.findAndCount({
            where: whereCondition,
            skip,
            take: limit,
            order: { createdAt: "DESC" },
        });

        return { data, total };
    }

    async getGraphDataById(id: string): Promise<any> {
        const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
        if (!jsonData) {
            throw new NotFoundException(`JSON с ID ${id} не найден`);
        }
        return jsonData;
    }

    async findGraphDataByIdOrNull(id: string): Promise<any | null> {
        const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
        return jsonData || null;
    }

    async getLatestGraphData(): Promise<any> {
        const currentData = await this.jsonDataRepository.findOne({
            where: { isCurrent: true },
        });
        if (currentData) {
            return currentData;
        }

        const latestList = await this.jsonDataRepository.find({
            order: { createdAt: "DESC" },
            take: 1,
        });
        return latestList.length ? latestList[0] : undefined;
    }

    async updateGraphData(
        id: string,
        input: UpdateJsonDataInput & { authorName?: string },
    ): Promise<any> {
        const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
        if (!jsonData) {
            throw new NotFoundException(`JSON с ID ${id} не найден`);
        }

        if (input.data) jsonData.data = input.data;
        if (input.name) jsonData.name = input.name;
        if (input.description) jsonData.description = input.description;
        if (input.authorName) jsonData.authorName = input.authorName;
        jsonData.updatedAt = new Date();

        return this.jsonDataRepository.save(jsonData);
    }

    async updateVersionInfo(
        id: string,
        versionInfo: VersionInfoDto,
    ): Promise<any> {
        await this.jsonDataRepository.update(id, {
            version: versionInfo.version,
            deprecated: versionInfo.deprecated,
        });
        return this.jsonDataRepository.findOne({ where: { id } });
    }

    async getDocumentHistory(
        id: string,
        fromDate?: string,
        toDate?: string,
    ): Promise<any[]> {
        // Создаем базовый запрос
        const queryBuilder = this.commitRepository.createQueryBuilder("commit")
            .where("commit.parent_id IS NULL") // Ищем оригинальные коммиты
            .andWhere("commit.commit ::jsonb @> :data", {
                data: JSON.stringify({ desc: { change_date: id } })
            });

        // Добавляем фильтры по дате если они есть
        if (fromDate) {
            queryBuilder.andWhere("commit.timestamp >= :fromDate", {
                fromDate: new Date(fromDate)
            });
        }
        if (toDate) {
            queryBuilder.andWhere("commit.timestamp <= :toDate", {
                toDate: new Date(toDate)
            });
        }

        // Выполняем запрос
        return await queryBuilder
            .orderBy("commit.created_at", "DESC")
            .getMany();
    }

    async deleteGraphData(id: string): Promise<void> {
        const result = await this.jsonDataRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`JSON с ID ${id} не найден`);
        }
        return;
    }

    async setCurrentById(id: string): Promise<any> {
        await this.jsonDataRepository.update({}, { isCurrent: false });

        const jsonData = await this.jsonDataRepository.findOne({ where: { id } });
        if (!jsonData) {
            throw new NotFoundException(`JSON с ID ${id} не найден`);
        }

        jsonData.isCurrent = true;
        const result = await this.jsonDataRepository.save(jsonData);

        await this.changelogService.logSetCurrent(result.id, result.name);
        return result;
    }

    async setCurrentFromSnapshot(snapshot: any): Promise<any> {
        const updateData: CreateJsonDataInput & { authorName?: string } = {
            name: snapshot.name,
            data: snapshot.data,
            description: `Восстановлено из снимка: ${snapshot.name}`,
            version: snapshot.version || "1.0.0",
            authorName: snapshot.authorName || "System",
        };

        const existingData = await this.findGraphDataByIdOrNull(
            snapshot.sourceDataId,
        );

        if (existingData) {
            await this.updateGraphData(snapshot.sourceDataId, updateData);
            return await this.setCurrentById(snapshot.sourceDataId);
        }
        const created = await this.createDataWithId(
            snapshot.sourceDataId,
            updateData,
        );
        return await this.setCurrentById(created.id);
    }

    /**
     * Сбрасывает все данные базы до исходного состояния.
     * Удаляет все JSON данные, коммиты, снепшоты и очищает changelog.
     * ВНИМАНИЕ: Этот метод предназначен только для тестирования!
     */
    async resetAllData(): Promise<{
        deletedJsonData: number;
        deletedCommits: number;
        deletedSnapshots: number;
        changelogCleared: boolean;
    }> {
        console.log("[JsonDataService] Начинаем сброс всех данных...");

        // Удаляем все коммиты
        const commitsResult = await this.commitRepository.delete({});
        const deletedCommits = commitsResult.affected || 0;
        console.log(`[JsonDataService] Удалено коммитов: ${deletedCommits}`);

        // Удаляем все JSON данные
        const jsonDataResult = await this.jsonDataRepository.delete({});
        const deletedJsonData = jsonDataResult.affected || 0;
        console.log(`[JsonDataService] Удалено JSON данных: ${deletedJsonData}`);

        // Удаляем все снепшоты
        const snapshotsResult = await this.snapshotRepository.delete({});
        const deletedSnapshots = snapshotsResult.affected || 0;
        console.log(`[JsonDataService] Удалено снепшотов: ${deletedSnapshots}`);

        // Очищаем changelog (in-memory storage)
        await this.changelogMemoryStorage.clear();
        console.log("[JsonDataService] Changelog очищен");

        console.log("[JsonDataService] Сброс данных завершен");

        return {
            deletedJsonData,
            deletedCommits,
            deletedSnapshots,
            changelogCleared: true,
        };
    }
}
