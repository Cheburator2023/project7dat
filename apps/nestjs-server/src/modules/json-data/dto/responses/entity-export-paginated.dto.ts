import { ApiProperty } from '@nestjs/swagger';
import { JsonExportResponseDto } from './json-export-response.dto';

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