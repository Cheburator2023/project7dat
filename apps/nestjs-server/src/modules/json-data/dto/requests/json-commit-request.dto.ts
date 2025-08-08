import { ApiProperty } from '@nestjs/swagger';
import { JsonCommitBaseDto } from '../base/json-commit-base.dto';

export class JsonCommitRequestDto extends JsonCommitBaseDto {
    @ApiProperty({
        description: 'ID графика для коммита',
        example: 'uuid-string',
        required: false,
    })
    graphId?: string;
}