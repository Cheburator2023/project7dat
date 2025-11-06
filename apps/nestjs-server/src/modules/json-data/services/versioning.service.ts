import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VersioningService {
    private readonly logger = new Logger(VersioningService.name);
    private readonly currentSchemaVersion = '2.0';
    private readonly supportedVersions = ['1.0', '1.1', '2.0'];

    constructor(private readonly configService: ConfigService) {}

    /**
     * Валидация совместимости версий схемы JSON
     */
    validateVersionCompatibility(schemaVersion: string): {
        compatible: boolean;
        migrationRequired: boolean;
        message: string;
        currentVersion: string;
        incomingVersion: string;
    } {
        const version = schemaVersion || '1.0';
        const currentMajor = parseInt(this.currentSchemaVersion.split('.')[0]);
        const incomingMajor = parseInt(version.split('.')[0]);
        const currentMinor = parseInt(this.currentSchemaVersion.split('.')[1] || '0');
        const incomingMinor = parseInt(version.split('.')[1] || '0');

        let compatible = false;
        let migrationRequired = false;
        let message = '';

        // Проверка поддержки версии
        const isSupported = this.supportedVersions.includes(version);

        if (!isSupported) {
            compatible = false;
            migrationRequired = true;
            message = `Версия ${version} не поддерживается. Поддерживаемые версии: ${this.supportedVersions.join(', ')}`;
        } else if (incomingMajor < currentMajor) {
            compatible = false;
            migrationRequired = true;
            message = `Версия ${version} устарела и требует миграции на ${this.currentSchemaVersion}`;
        } else if (incomingMajor > currentMajor) {
            compatible = false;
            migrationRequired = false;
            message = `Версия ${version} новее поддерживаемой ${this.currentSchemaVersion}. Обновите систему`;
        } else if (incomingMinor > currentMinor) {
            compatible = true;
            migrationRequired = false;
            message = `Версия ${version} поддерживается с ограничениями. Рекомендуется обновление`;
        } else {
            compatible = true;
            migrationRequired = false;
            message = `Версия ${version} полностью совместима`;
        }

        return {
            compatible,
            migrationRequired,
            message,
            currentVersion: this.currentSchemaVersion,
            incomingVersion: version
        };
    }

    /**
     * Обработка обратной совместимости для разных версий JSON
     */
    handleBackwardCompatibility(data: any, schemaVersion: string): any {
        this.logger.log(`Обработка обратной совместимости для версии: ${schemaVersion}`);

        const normalized = JSON.parse(JSON.stringify(data));

        // Для версии 1.0 добавляем отсутствующие поля
        if (schemaVersion === '1.0') {
            if (normalized.entities && Array.isArray(normalized.entities)) {
                normalized.entities.forEach((entity: any) => {
                    if (entity.modified === undefined) {
                        entity.modified = false;
                    }
                    if (!entity.namespace) {
                        entity.namespace = 'default';
                    }
                });
            }

            if (normalized.mappings && Array.isArray(normalized.mappings)) {
                normalized.mappings.forEach((mapping: any) => {
                    if (!mapping.deps) {
                        mapping.deps = [];
                    }
                });
            }

            if (!normalized.desc) {
                normalized.desc = {};
            }
            if (!normalized.desc.schemaVersion) {
                normalized.desc.schemaVersion = '1.0';
            }
        }

        this.logger.log(`Обратная совместимость обработана для версии: ${schemaVersion}`);
        return normalized;
    }

    /**
     * Миграция данных между версиями схем
     */
    migrateDataToCurrentVersion(data: any, fromVersion: string): any {
        this.logger.log(`Миграция данных с версии ${fromVersion} на ${this.currentSchemaVersion}`);

        let migrated = JSON.parse(JSON.stringify(data));

        // Определяем порядок миграций
        const migrationPath = this.getMigrationPath(fromVersion, this.currentSchemaVersion);

        for (const migration of migrationPath) {
            this.logger.log(`Применение миграции: ${migration.from} -> ${migration.to}`);
            migrated = this.applyMigration(migrated, migration.from, migration.to);
        }

        // Обновление версии схемы
        if (migrated.desc) {
            migrated.desc.schemaVersion = this.currentSchemaVersion;
        } else {
            migrated.desc = { schemaVersion: this.currentSchemaVersion };
        }

        this.logger.log(`Миграция завершена: ${fromVersion} -> ${this.currentSchemaVersion}`);
        return migrated;
    }

    /**
     * Получение пути миграции между версиями
     */
    private getMigrationPath(fromVersion: string, toVersion: string): Array<{from: string; to: string}> {
        const versions = ['0.9', '1.0', '1.1', '2.0'];
        const fromIndex = versions.indexOf(fromVersion);
        const toIndex = versions.indexOf(toVersion);

        if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
            return [];
        }

        const path: Array<{from: string; to: string}> = [];
        for (let i = fromIndex; i < toIndex; i++) {
            path.push({
                from: versions[i],
                to: versions[i + 1]
            });
        }

        return path;
    }

    /**
     * Применение конкретной миграции
     */
    private applyMigration(data: any, fromVersion: string, toVersion: string): any {
        const migrated = JSON.parse(JSON.stringify(data));

        switch (`${fromVersion}-${toVersion}`) {
            case '0.9-1.0':
                return this.migrateFromV09ToV10(migrated);
            case '1.0-1.1':
                return this.migrateFromV10ToV11(migrated);
            case '1.1-2.0':
                return this.migrateFromV11ToV20(migrated);
            default:
                this.logger.warn(`Неизвестный путь миграции: ${fromVersion} -> ${toVersion}`);
                return migrated;
        }
    }

    /**
     * Получение информации о версиях
     */
    getVersionInfo(): {
        currentVersion: string;
        supportedVersions: string[];
        migrationPaths: { from: string; to: string; available: boolean }[];
    } {
        const migrationPaths = [
            { from: '0.9', to: '1.0', available: true },
            { from: '1.0', to: '1.1', available: true },
            { from: '1.1', to: '2.0', available: true }
        ];

        return {
            currentVersion: this.currentSchemaVersion,
            supportedVersions: this.supportedVersions,
            migrationPaths
        };
    }

    /**
     * Сравнение версий
     */
    compareVersions(version1: string, version2: string): -1 | 0 | 1 {
        const v1 = version1.split('.').map(Number);
        const v2 = version2.split('.').map(Number);

        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;

            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }

        return 0;
    }

    /**
     * Проверка, требуется ли миграция
     */
    isMigrationRequired(fromVersion: string, toVersion?: string): boolean {
        const targetVersion = toVersion || this.currentSchemaVersion;
        return this.compareVersions(fromVersion, targetVersion) < 0;
    }

    /**
     * Миграция с версии 0.9 на 1.0
     */
    private migrateFromV09ToV10(data: any): any {
        const migrated = JSON.parse(JSON.stringify(data));

        // Переименование dependencies -> deps
        if (migrated.mappings && Array.isArray(migrated.mappings)) {
            migrated.mappings = migrated.mappings.map((mapping: any) => {
                if (mapping.dependencies) {
                    const { dependencies, ...rest } = mapping;
                    return {
                        ...rest,
                        deps: dependencies
                    };
                }
                return mapping;
            });
        }

        // Добавление обязательных полей для entities
        if (migrated.entities && Array.isArray(migrated.entities)) {
            migrated.entities.forEach((entity: any) => {
                if (entity.modified === undefined) {
                    entity.modified = false;
                }
                if (!entity.namespace) {
                    entity.namespace = 'default';
                }
            });
        }

        return migrated;
    }

    /**
     * Миграция с версии 1.0 на 1.1
     */
    private migrateFromV10ToV11(data: any): any {
        const migrated = JSON.parse(JSON.stringify(data));

        // Добавление поддержки новых типов сущностей
        if (migrated.entities && Array.isArray(migrated.entities)) {
            migrated.entities.forEach((entity: any) => {
                if (entity.type === 'sql_table') {
                    entity.type = 'table';
                } else if (entity.type === 'sql_view') {
                    entity.type = 'view';
                }
            });
        }

        return migrated;
    }

    /**
     * Миграция с версии 1.1 на 2.0
     */
    private migrateFromV11ToV20(data: any): any {
        const migrated = JSON.parse(JSON.stringify(data));

        // Добавление расширенных метаданных
        if (migrated.desc) {
            migrated.desc.timestamp = new Date().toISOString();
            migrated.desc.version = '2.0';
        }

        // Добавление поля failedMappings для DAPP JSON
        if (!migrated.failedMappings) {
            migrated.failedMappings = [];
        }

        // Добавление поля unmatched для каждого маппинга
        if (migrated.mappings && Array.isArray(migrated.mappings)) {
            migrated.mappings.forEach((mapping: any) => {
                if (mapping.unmatched === undefined) {
                    mapping.unmatched = [];
                }
            });
        }

        return migrated;
    }

    /**
     * Создание дампа схемы для отладки
     */
    createSchemaDump(data: any): {
        version: string;
        entitiesCount: number;
        mappingsCount: number;
        entityTypes: string[];
        attributeTypes: string[];
        schemaInfo: any;
    } {
        const entityTypes = new Set<string>();
        const attributeTypes = new Set<string>();

        if (data.entities && Array.isArray(data.entities)) {
            data.entities.forEach((entity: any) => {
                if (entity.type) {
                    entityTypes.add(entity.type);
                }
                if (entity.attrSeq && Array.isArray(entity.attrSeq)) {
                    entity.attrSeq.forEach((attr: any) => {
                        if (attr.type) {
                            attributeTypes.add(attr.type);
                        }
                    });
                }
            });
        }

        return {
            version: data.desc?.schemaVersion || 'unknown',
            entitiesCount: data.entities?.length || 0,
            mappingsCount: data.mappings?.length || 0,
            entityTypes: Array.from(entityTypes),
            attributeTypes: Array.from(attributeTypes),
            schemaInfo: {
                hasDesc: !!data.desc,
                hasEntities: !!data.entities,
                hasMappings: !!data.mappings,
                hasFailedMappings: !!data.failedMappings
            }
        };
    }
}