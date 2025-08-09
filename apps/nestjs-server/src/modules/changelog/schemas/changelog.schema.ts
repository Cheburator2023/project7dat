import { ApiProperty } from "@nestjs/swagger";
import {
	IsEnum,
	IsOptional,
	IsString,
	IsUUID,
	IsDateString,
} from "class-validator";
import { ChangelogActionType } from "../entities/changelog.entity";

export class ChangelogEntryDto {
	@ApiProperty({ description: "ID записи changelog" })
	@IsUUID()
	id: string;

	@ApiProperty({ description: "ID графика" })
	@IsUUID()
	graphId: string;

	@ApiProperty({ description: "Название графика" })
	@IsString()
	graphName: string;

	@ApiProperty({
		description: "Тип действия",
		enum: ChangelogActionType,
	})
	@IsEnum(ChangelogActionType)
	actionType: ChangelogActionType;

	@ApiProperty({ description: "Описание действия" })
	@IsString()
	actionDescription: string;

	@ApiProperty({ description: "Детали изменения", required: false })
	@IsOptional()
	@IsString()
	details?: string;

	@ApiProperty({ description: "Автор изменения", required: false })
	@IsOptional()
	@IsString()
	author?: string;

	@ApiProperty({ description: "ID коммита", required: false })
	@IsOptional()
	@IsUUID()
	commitId?: string;

	@ApiProperty({ description: "ID снепшота", required: false })
	@IsOptional()
	@IsUUID()
	snapshotId?: string;

	@ApiProperty({ description: "Версия", required: false })
	@IsOptional()
	@IsString()
	version?: string;

	@ApiProperty({ description: "Дата создания" })
	@IsDateString()
	createdAt: Date;
}

export class ChangelogGroupDto {
	@ApiProperty({ description: "Дата группы (YYYY-MM-DD)" })
	@IsString()
	date: string;

	@ApiProperty({
		description: "Записи changelog за эту дату",
		type: [ChangelogEntryDto],
	})
	entries: ChangelogEntryDto[];
}

export class ChangelogResponseDto {
	@ApiProperty({
		description: "Группированные записи по датам",
		type: [ChangelogGroupDto],
	})
	groups: ChangelogGroupDto[];

	@ApiProperty({ description: "Общее количество записей" })
	total: number;

	@ApiProperty({ description: "Номер страницы" })
	page: number;

	@ApiProperty({ description: "Размер страницы" })
	limit: number;
}

export class GetChangelogQueryDto {
	@ApiProperty({ description: "Номер страницы", required: false, default: 1 })
	@IsOptional()
	page?: number;

	@ApiProperty({ description: "Размер страницы", required: false, default: 20 })
	@IsOptional()
	limit?: number;

	@ApiProperty({
		description: "Фильтр по типу действия",
		required: false,
		enum: ChangelogActionType,
	})
	@IsOptional()
	@IsEnum(ChangelogActionType)
	actionType?: ChangelogActionType;

	@ApiProperty({ description: "Фильтр по автору", required: false })
	@IsOptional()
	@IsString()
	author?: string;

	@ApiProperty({
		description: "Дата начала периода (YYYY-MM-DD)",
		required: false,
	})
	@IsOptional()
	@IsDateString()
	dateFrom?: string;

	@ApiProperty({
		description: "Дата окончания периода (YYYY-MM-DD)",
		required: false,
	})
	@IsOptional()
	@IsDateString()
	dateTo?: string;
}
