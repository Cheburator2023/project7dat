import { ApiProperty } from '@nestjs/swagger';
import { JsonExportResponseDto } from '../../json-data/dto/responses/json-export-response.dto';

export class MergeDiffDto {
    @ApiProperty({
        description: 'Тип изменения',
        enum: ['added', 'removed', 'modified'],
    })
    type: 'added' | 'removed' | 'modified';

    @ApiProperty({ description: 'Путь к измененному свойству' })
    path: string;

    @ApiProperty({ description: 'Старое значение (если есть)' })
    oldValue?: any;

    @ApiProperty({ description: 'Новое значение (если есть)' })
    newValue?: any;
}

export class ApplyMergeResponseDto {
    @ApiProperty({
        description: 'Уникальный идентификатор операции слияния',
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    })
    mergeSessionId: string;

    @ApiProperty({
        description: 'JSON смерженной модели данных',
        type: JsonExportResponseDto,
    })
    mergedJson: JsonExportResponseDto;

    @ApiProperty({
        description: 'Список изменений (diff)',
        type: [MergeDiffDto],
    })
    diff: MergeDiffDto[];

    @ApiProperty({
        description: 'Количество измененных сущностей',
        example: 5,
    })
    changedEntitiesCount: number;

    @ApiProperty({
        description: 'Количество измененных атрибутов',
        example: 12,
    })
    changedAttributesCount: number;

    @ApiProperty({
        description: 'Количество измененных маппингов',
        example: 3,
    })
    changedMappingsCount: number;
}

export class ConfirmMergeResponseDto {
    @ApiProperty({ description: 'Успешность операции', example: true })
    success: boolean;

    @ApiProperty({ description: 'ID созданного снепшота', example: 'uuid-snapshot' })
    snapshotId: string;

    @ApiProperty({ description: 'Сообщение', example: 'Модель данных успешно обновлена' })
    message: string;
}

export class CancelMergeResponseDto {
    @ApiProperty({ description: 'Успешность операции', example: true })
    success: boolean;

    @ApiProperty({ description: 'Сообщение', example: 'Слияние отменено, временные данные удалены' })
    message: string;
}

export class EntityExportPaginatedResponseDto {
    @ApiProperty({ type: JsonExportResponseDto })
    data: JsonExportResponseDto;

    @ApiProperty({ description: 'Общее количество маппингов', example: 45 })
    totalMappings: number;

    @ApiProperty({ description: 'Общее количество зависимостей', example: 120 })
    totalDependencies: number;

    @ApiProperty({ description: 'Текущая страница', example: 1 })
    page: number;

    @ApiProperty({ description: 'Лимит на страницу', example: 20 })
    limit: number;

    @ApiProperty({ description: 'Всего страниц', example: 3 })
    totalPages: number;
}