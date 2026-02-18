import { Injectable } from '@nestjs/common';

export interface DiffChange {
    type: 'added' | 'removed' | 'modified';
    path: string;
    oldValue?: any;
    newValue?: any;
}

@Injectable()
export class DiffService {
    /**
     * Сравнивает два JSON объекта и возвращает список изменений.
     */
    computeDiff(oldObj: any, newObj: any, basePath: string = ''): DiffChange[] {
        const changes: DiffChange[] = [];

        // Если оба null/undefined – без изменений
        if (oldObj === newObj) {
            return changes;
        }

        // Типы разные или один из них null/undefined
        if (
            oldObj === null || oldObj === undefined ||
            newObj === null || newObj === undefined ||
            typeof oldObj !== typeof newObj
        ) {
            changes.push({
                type: 'modified',
                path: basePath || '/',
                oldValue: oldObj,
                newValue: newObj,
            });
            return changes;
        }

        // Если примитивы
        if (typeof oldObj !== 'object') {
            if (oldObj !== newObj) {
                changes.push({
                    type: 'modified',
                    path: basePath || '/',
                    oldValue: oldObj,
                    newValue: newObj,
                });
            }
            return changes;
        }

        // Оба – объекты или массивы
        const oldKeys = new Set(Object.keys(oldObj));
        const newKeys = new Set(Object.keys(newObj));

        // Удаленные ключи
        for (const key of oldKeys) {
            if (!newKeys.has(key)) {
                const path = this.joinPath(basePath, key);
                changes.push({
                    type: 'removed',
                    path,
                    oldValue: oldObj[key],
                });
            }
        }

        // Добавленные и измененные ключи
        for (const key of newKeys) {
            const path = this.joinPath(basePath, key);
            if (!oldKeys.has(key)) {
                changes.push({
                    type: 'added',
                    path,
                    newValue: newObj[key],
                });
            } else {
                // Рекурсивно сравниваем
                const nestedChanges = this.computeDiff(oldObj[key], newObj[key], path);
                changes.push(...nestedChanges);
            }
        }

        return changes;
    }

    private joinPath(base: string, key: string): string {
        if (base === '' || base === '/') {
            return `/${key}`;
        }
        return `${base}/${key}`;
    }
}