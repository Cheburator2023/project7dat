import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export enum CommitStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    LOADED_VALIDATED = 'LOADED_VALIDATED',
    LOADED_VALIDATION_ERROR = 'LOADED_VALIDATION_ERROR',
    PARTIALLY_LOADED = 'PARTIALLY_LOADED',
    CANCELLED = 'CANCELLED',
}

export class CommitStatusDto {
    @ApiProperty({
        description: 'Статус коммита',
        enum: CommitStatus,
        example: CommitStatus.LOADED_VALIDATED,
    })
    @IsString()
    @IsEnum(CommitStatus)
    status: CommitStatus;
}