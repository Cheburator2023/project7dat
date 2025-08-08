import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';

export class JsonCommitBaseDto {
    @ApiProperty({
        description: 'Сообщение коммита',
        example: 'Обновлены узлы графа',
    })
    @IsString()
    message: string;

    @ApiProperty({
        description: 'JSON данные для коммита',
        example: { entities: [], mappings: [] },
    })
    @IsObject()
    data: Record<string, any>;

    @ApiProperty({
        description: 'Автор коммита',
        example: { id: 'user-id', username: 'user', email: 'user@example.com' },
        required: false,
    })
    @IsOptional()
    @IsObject()
    author?: {
        id: string;
        username: string;
        email: string;
    };
}