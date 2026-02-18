import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsEnum } from 'class-validator';
import { S2TFileType } from '../interfaces/s2t-file-type.enum';

export class ConvertJsonToS2tDto {
    @ApiProperty({ description: 'JSON коммита в формате DL' })
    @IsObject()
    jsonData: Record<string, any>;

    @ApiProperty({ description: 'Тип S2T файла (опционально)', enum: S2TFileType, required: false })
    @IsOptional()
    @IsEnum(S2TFileType)
    fileType?: S2TFileType;
}