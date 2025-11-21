import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { ChangeEntity } from '../entities/change.entity';

@Injectable()
export class ChangeRecordService {
    async createChangeRecord(
        data: any,
        user: string,
        changeName: string,
        queryRunner: QueryRunner,
    ): Promise<number> {
        const change = new ChangeEntity();
        change.change_date = new Date();
        change.change_user = user;
        change.change_name = changeName;
        change.app_id = data.desc?.appId;
        change.raw_json = JSON.stringify(data);
        change.user_id = user;
        change.schema_version = data.desc?.schemaVersion || '1.0';
        change.deprecation = false;

        const savedChange = await queryRunner.manager.save(ChangeEntity, change);
        return savedChange.change_id;
    }
}