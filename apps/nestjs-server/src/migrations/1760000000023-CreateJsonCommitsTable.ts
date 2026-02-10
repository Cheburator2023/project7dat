import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateJsonCommitsTable1760000000022 implements MigrationInterface {
    name = "CreateJsonCommitsTable1760000000022";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS json_commits (
                                                        commit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_name VARCHAR(255) NOT NULL,
                parent_id UUID,
                commit_name VARCHAR(255) NOT NULL,
                commit_description TEXT,
                state VARCHAR(50) DEFAULT 'processing',
                commit JSONB,
                type VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_json_commits_parent FOREIGN KEY (parent_id) REFERENCES json_commits(commit_id),
                CONSTRAINT json_commits_state_check CHECK (state IN ('processing', 'done')),
                CONSTRAINT json_commits_type_check CHECK (type IN ('table', 'json', 'model'))
                )
        `);

        // Создаем индексы
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_json_commits_parent_id ON json_commits(parent_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_json_commits_state ON json_commits(state)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_json_commits_type ON json_commits(type)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_json_commits_timestamp ON json_commits(timestamp)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_json_commits_user ON json_commits(user_name)
        `);

        // Комментарии
        await queryRunner.query(`
            COMMENT ON TABLE json_commits IS 'Таблица для хранения JSON коммитов системы Data Lineage'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.commit_id IS 'GUID, присваиваемый пользовательской версии коммита в момент сохранения в БД'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.timestamp IS 'Время отправки/сохранения коммита'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.user_name IS 'ФИО пользователя, который загрузил/редактировал коммит'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.parent_id IS 'GUID родительской записи с оригиналом коммита. Для оригинала значение NULL'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.commit_name IS 'Имя коммита в системе Data Lineage'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.commit_description IS 'Описание коммита в системе Data Lineage'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.state IS 'Статус обработки коммита: processing - обработка, done - выполнен'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.commit IS 'JSON файл коммита, исходный или в редакции пользователя. Может быть NULL для оригинала коммита'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.type IS 'Тип коммита: table - витрина-источник, json - json файл источник, model - спецификация модели'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.created_at IS 'Дата создания записи'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN json_commits.updated_at IS 'Дата последнего обновления записи'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS json_commits`);
    }
}