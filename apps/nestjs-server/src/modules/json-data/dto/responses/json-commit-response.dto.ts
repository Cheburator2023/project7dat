import { ApiProperty } from "@nestjs/swagger";

export class JsonCommitResponseDto {
    @ApiProperty({
        description: "GUID пользовательской версии коммита",
        example: "123e4567-e89b-12d3-a456-426614174000"
    })
    commit_id: string;

    @ApiProperty({
        description: "Время отправки коммита",
        example: "2024-01-15T10:30:00.000Z"
    })
    timestamp: Date;

    @ApiProperty({
        description: "ФИО пользователя, который загрузил коммит",
        example: "Иванов Иван Иванович"
    })
    user: string;

    @ApiProperty({
        description: "GUID родительской записи с оригиналом коммита",
        example: "123e4567-e89b-12d3-a456-426614174001",
        nullable: true
    })
    parent_id: string | null;

    @ApiProperty({
        description: "Имя коммита в системе Data Lineage",
        example: "Обновление витрины продаж"
    })
    commit_name: string;

    @ApiProperty({
        description: "Описание коммита в системе Data Lineage",
        example: "Обновление данных за январь 2024",
        nullable: true
    })
    commit_description: string | null;

    @ApiProperty({
        description: "Статус обработки коммита",
        enum: ["processing", "done"],
        example: "processing"
    })
    state: "processing" | "done";

    @ApiProperty({
        description: "JSON файл коммита",
        example: { entities: [], mappings: [] },
        nullable: true
    })
    commit: Record<string, any> | null;

    @ApiProperty({
        description: "Тип коммита",
        enum: ["table", "json", "model"],
        example: "table"
    })
    type: "table" | "json" | "model";

    @ApiProperty({
        description: "Дата создания записи",
        example: "2024-01-15T10:30:00.000Z"
    })
    created_at: Date;

    @ApiProperty({
        description: "Дата последнего обновления",
        example: "2024-01-15T10:30:00.000Z"
    })
    updated_at: Date;
}

export class JsonCommitListResponseDto {
    @ApiProperty({
        description: "Список коммитов",
        type: [JsonCommitResponseDto]
    })
    commits: JsonCommitResponseDto[];

    @ApiProperty({
        description: "Общее количество коммитов",
        example: 100
    })
    total: number;
}
