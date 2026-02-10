import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { SnapshotEntity } from "../entities/snapshot.entity";

@Injectable()
export class SnapshotService {
    constructor(
        @Optional()
        @InjectRepository(SnapshotEntity)
        private readonly snapshotRepository: Repository<SnapshotEntity>,
        readonly _configService: ConfigService,
    ) {}

    /**
     * Создание снепшота
     */
    async createSnapshot(user: string, snapshotJson: Record<string, any>): Promise<SnapshotEntity> {
        const snapshot = this.snapshotRepository.create({
            user,
            snapshot_json: snapshotJson,
        });

        return await this.snapshotRepository.save(snapshot);
    }

    /**
     * Получение снепшотов с пагинацией
     */
    async getAllSnapshotsWithPagination(
        input: { page: number; limit: number; search?: string }
    ): Promise<{ data: SnapshotEntity[]; total: number }> {
        const { page, limit, search } = input;
        const skip = (page - 1) * limit;

        const whereCondition = search
            ? [{ user: Like(`%${search}%`) }]
            : {};

        const [data, total] = await this.snapshotRepository.findAndCount({
            where: whereCondition,
            skip,
            take: limit,
            order: { timestamp: "DESC" },
        });

        return { data, total };
    }

    /**
     * Получение снепшота по ID
     */
    async getSnapshotById(id: string): Promise<SnapshotEntity> {
        const snapshot = await this.snapshotRepository.findOne({
            where: { snapshot_id: id }
        });

        if (!snapshot) {
            throw new NotFoundException(`Снимок с ID ${id} не найден`);
        }

        return snapshot;
    }

    /**
     * Получение последнего снепшота
     */
    async getLatestSnapshot(): Promise<SnapshotEntity | null> {
        try {
            return await this.snapshotRepository.findOne({
                order: { timestamp: "DESC" },
            });
        } catch (error) {
            console.error("Ошибка при получении последнего снимка:", error);
            return null;
        }
    }

    /**
     * Удаление снепшота по ID
     */
    async deleteSnapshot(id: string): Promise<{ deleted: boolean }> {
        const result = await this.snapshotRepository.delete(id);
        return { deleted: result.affected ? result.affected > 0 : false };
    }

    /**
     * Получение снепшотов по временному диапазону
     */
    async getSnapshotsByDateRange(
        startDate: Date,
        endDate: Date,
    ): Promise<SnapshotEntity[]> {
        return await this.snapshotRepository
            .createQueryBuilder("snapshot")
            .where("snapshot.timestamp BETWEEN :startDate AND :endDate", {
                startDate,
                endDate,
            })
            .orderBy("snapshot.timestamp", "DESC")
            .getMany();
    }
}