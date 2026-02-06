import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
	S2tCommitEntity,
	type S2tCommitState,
} from "../entities/s2t-commit.entity";
import { CreateS2tCommitRequestDto } from "../dto/requests/create-s2t-commit-request.dto";
import { JsonImportService } from "./json-import.service";
import {
	JsonSourceType,
	JsonImportRequestDto,
} from "../dto/requests/json-import-request.dto";

@Injectable()
export class S2tCommitStoreService {
	private readonly logger = new Logger(S2tCommitStoreService.name);

	constructor(
		@InjectRepository(S2tCommitEntity)
		private readonly repo: Repository<S2tCommitEntity>,
		private readonly jsonImportService: JsonImportService,
	) {}

	async createOrUpdate(
		dto: CreateS2tCommitRequestDto,
	): Promise<S2tCommitEntity> {
		if (dto.id) {
			const existing = await this.repo.findOne({ where: { id: dto.id } });
			if (!existing) {
				throw new NotFoundException(`S2T commit ${dto.id} not found`);
			}

			existing.parent_id = dto.parent_id ?? existing.parent_id;
			existing.commit_name = dto.commit_name;
			existing.commit_description = dto.commit_description ?? null;
			existing.payload = dto.payload;
			// type сохраняем только при первом сохранении оригинала, но при update не меняем
			// если надо сменить тип - это новая запись
			existing.user = dto.user ?? existing.user;
			existing.state = "processing";
			existing.error = null;
			existing.change_id = null;

			return await this.repo.save(existing);
		}

		const entity = this.repo.create({
			parent_id: dto.parent_id ?? null,
			commit_name: dto.commit_name,
			commit_description: dto.commit_description ?? null,
			type: dto.type,
			state: "processing",
			user: dto.user ?? null,
			payload: dto.payload,
			change_id: null,
			error: null,
		});

		return await this.repo.save(entity);
	}

	async findById(id: string): Promise<S2tCommitEntity> {
		const commit = await this.repo.findOne({ where: { id } });
		if (!commit) throw new NotFoundException(`S2T commit ${id} not found`);
		return commit;
	}

	async list(params?: {
		state?: string;
		type?: string;
	}): Promise<S2tCommitEntity[]> {
		const where: any = {};
		if (params?.state) where.state = params.state;
		if (params?.type) where.type = params.type;
		return await this.repo.find({ where, order: { created_at: "DESC" } });
	}

	async applyCommit(params: {
		id: string;
		user?: string;
		sourceType?: JsonSourceType;
	}): Promise<{ changeId: number; commit: S2tCommitEntity }> {
		const commit = await this.findById(params.id);

		if (commit.state === "done") {
			throw new BadRequestException("Commit already applied");
		}

		await this.setState(commit.id, "processing");

		try {
			const importReq: JsonImportRequestDto = {
				data: commit.payload,
				user: params.user ?? commit.user ?? "system",
				changeName: commit.commit_name,
				validated: true,
				sourceType: params.sourceType ?? JsonSourceType.DAPP,
			};

			const result = await this.jsonImportService.importJsonData(importReq);

			commit.state = "done";
			commit.change_id = result.changeId;
			commit.error = null;
			const saved = await this.repo.save(commit);

			return { changeId: result.changeId, commit: saved };
		} catch (e: any) {
			const errMsg = e?.response?.message || e?.message || "Apply failed";
			commit.state = "failed";
			commit.error = String(errMsg);
			commit.change_id = null;
			await this.repo.save(commit);
			this.logger.error(
				`Apply failed for commit ${commit.id}: ${errMsg}`,
				e?.stack,
			);
			throw e;
		}
	}

	async deleteCommit(id: string): Promise<void> {
		const commit = await this.findById(id);

		if (commit.state === "done") {
			throw new BadRequestException("Нельзя удалить уже применённый коммит");
		}

		await this.repo.remove(commit);
	}

	private async setState(id: string, state: S2tCommitState): Promise<void> {
		await this.repo.update(id, { state, updated_at: new Date() });
	}
}
