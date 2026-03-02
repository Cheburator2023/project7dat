import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { ConvertJsonToS2tDto } from '../dto/convert-json-to-s2t.dto';

@Injectable()
export class JsonToS2tTransformPipe implements PipeTransform {
    transform(value: any, _metadata: ArgumentMetadata): ConvertJsonToS2tDto {
        // Логирование для отладки (можно удалить после устранения проблемы)
        console.log('JsonToS2tTransformPipe input:', JSON.stringify(value).slice(0, 300));

        if (value === null || value === undefined || typeof value !== 'object') {
            throw new BadRequestException('Тело запроса должно быть объектом JSON');
        }

        let dtoPlain: any;
        if ('jsonData' in value) {
            dtoPlain = value;
        } else {
            dtoPlain = { jsonData: value };
        }

        const dto = plainToClass(ConvertJsonToS2tDto, dtoPlain);

        const errors = validateSync(dto);
        if (errors.length > 0) {
            const messages = errors.map((err: ValidationError) => {
                if (err.constraints) {
                    return `${err.property}: ${Object.values(err.constraints).join(', ')}`;
                }
                return `${err.property}: неизвестная ошибка валидации`;
            }).join('; ');
            throw new BadRequestException(`Ошибка валидации: ${messages}`);
        }

        return dto;
    }
}
