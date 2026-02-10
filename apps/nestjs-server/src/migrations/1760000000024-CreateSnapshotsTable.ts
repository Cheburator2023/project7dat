import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSnapshotsTable1760000000023 implements MigrationInterface {
    name = "CreateSnapshotsTable1760000000023";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS snapshots (
                                                     snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_name VARCHAR(255) NOT NULL,
                snapshot_json JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON snapshots(timestamp)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_snapshots_user ON snapshots(user_name)
        `);

        await queryRunner.query(`
            COMMENT ON TABLE snapshots IS 'Таблица для хранения снимков (snapshots) модели данных системы Data Lineage'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN snapshots.snapshot_id IS 'GUID, присваиваемый snapshot в момент сохранения в БД'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN snapshots.timestamp IS 'Дата и время сохранения snapshot'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN snapshots.user_name IS 'ФИО пользователя, который внес изменения последним'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN snapshots.snapshot_json IS 'JSON текущей модели данных (все данные моделей из РБД)'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN snapshots.created_at IS 'Дата создания записи'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN snapshots.updated_at IS 'Дата последнего обновления записи'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS snapshots`);
    }
}