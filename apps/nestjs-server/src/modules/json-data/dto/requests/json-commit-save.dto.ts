import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsUUID, IsEnum, IsObject, IsDateString } from "class-validator";

export enum CommitType {
    TABLE = "table",
    JSON = "json",
    MODEL = "model"
}

export class JsonCommitSaveRequestDto {
    @ApiProperty({
        description: "GUID пользовательской версии коммита. Для оригинала - пустое значение",
        example: "123e4567-e89b-12d3-a456-426614174000",
        required: false
    })
    @IsOptional()
    @IsUUID()
    commit_id?: string;

    @ApiProperty({
        description: "Время сохранения коммита",
        example: "2024-01-15T10:30:00.000Z"
    })
    @IsDateString()
    timestamp: string;

    @ApiProperty({
        description: "ФИО пользователя",
        example: "Иванов Иван Иванович"
    })
    @IsString()
    user: string;

    @ApiProperty({
        description: "Имя коммита в системе Data Lineage",
        example: "Обновление витрины продаж"
    })
    @IsString()
    commit_name: string;

    @ApiProperty({
        description: "Описание коммита в системе Data Lineage",
        example: "Обновление данных за январь 2024",
        required: false
    })
    @IsOptional()
    @IsString()
    commit_description?: string;

    @ApiProperty({
        description: "JSON файл коммита",
        example: { entities: [], mappings: [] },
        required: false
    })
    @IsOptional()
    @IsObject()
    commit?: Record<string, any>;

    @ApiProperty({
        description: "Тип коммита. Сохраняется только при первом сохранении оригинала",
        enum: CommitType,
        example: CommitType.TABLE
    })
    @IsEnum(CommitType)
    type: CommitType;

    @ApiProperty({
        description: "GUID родительской записи. Для оригинала - NULL, для пользовательской версии - GUID оригинала",
        example: "123e4567-e89b-12d3-a456-426614174001",
        required: false,
        nullable: true
    })
    @IsOptional()
    @IsUUID()
    parent_id?: string | null;
}

export class JsonCommitStatusUpdateDto {
    @ApiProperty({
        description: "Статус коммита",
        enum: ["done"],
        example: "done"
    })
    @IsString()
    state: "done";
}