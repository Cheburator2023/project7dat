/**
 * Структурированные изменения коммита для Data Lineage схемы.
 * Позволяет точно определить какие объекты и данные изменились.
 */

import type { DataLineageEntity, DataLineageMapping } from './types';

/**
 * Изменения в конкретном поле сущности
 */
export interface FieldChange<T = any> {
  field: string;
  oldValue: T;
  newValue: T;
}

/**
 * Добавленная сущность
 */
export interface AddedEntity {
  id: string;
  type: DataLineageEntity['type'];
  name: string | null;
  namespace?: string;
  data: DataLineageEntity;
}

/**
 * Удаленная сущность
 */
export interface RemovedEntity {
  id: string;
  type?: DataLineageEntity['type'];
  name?: string | null;
}

/**
 * Измененная сущность с детализацией изменений
 */
export interface ModifiedEntity {
  id: string;
  type: DataLineageEntity['type'];
  name: string | null;
  changes: FieldChange[];
  oldData?: Partial<DataLineageEntity>;
  newData?: Partial<DataLineageEntity>;
}

/**
 * Изменения в сущностях (entities)
 */
export interface EntityChanges {
  added: AddedEntity[];
  removed: RemovedEntity[];
  modified: ModifiedEntity[];
}

/**
 * Добавленный маппинг
 */
export interface AddedMapping {
  id: number;
  entityId: string;
  data: DataLineageMapping;
}

/**
 * Удаленный маппинг
 */
export interface RemovedMapping {
  id: number;
  entityId?: string;
}

/**
 * Измененный маппинг с детализацией
 */
export interface ModifiedMapping {
  id: number;
  entityId: string;
  changes: FieldChange[];
  oldData?: Partial<DataLineageMapping>;
  newData?: Partial<DataLineageMapping>;
}

/**
 * Изменения в маппингах
 */
export interface MappingChanges {
  added: AddedMapping[];
  removed: RemovedMapping[];
  modified: ModifiedMapping[];
}

/**
 * Сводка изменений коммита
 */
export interface ChangesSummary {
  totalChanges: number;
  entities: {
    added: number;
    removed: number;
    modified: number;
  };
  mappings: {
    added: number;
    removed: number;
    modified: number;
  };
}

/**
 * Полная структура изменений коммита
 */
export interface CommitChanges {
  entities: EntityChanges;
  mappings: MappingChanges;
  summary: ChangesSummary;
}

/**
 * Расширенный ответ коммита с детальными изменениями
 */
export interface CommitWithChanges {
  id: string;
  shortId: string;
  timestamp: string;
  author: string;
  message: string;
  graphId: string;
  version: string;
  status: string;
  changes: CommitChanges;
  /** Legacy diff для обратной совместимости */
  diff?: Record<string, any>;
}

/**
 * Тип изменения
 */
export type ChangeType = 'added' | 'removed' | 'modified';

/**
 * Утилитарная функция для создания пустой структуры изменений
 */
export function createEmptyChanges(): CommitChanges {
  return {
    entities: {
      added: [],
      removed: [],
      modified: [],
    },
    mappings: {
      added: [],
      removed: [],
      modified: [],
    },
    summary: {
      totalChanges: 0,
      entities: { added: 0, removed: 0, modified: 0 },
      mappings: { added: 0, removed: 0, modified: 0 },
    },
  };
}

/**
 * Вычисляет сводку изменений
 */
export function calculateSummary(changes: Omit<CommitChanges, 'summary'>): ChangesSummary {
  const entitiesAdded = changes.entities.added.length;
  const entitiesRemoved = changes.entities.removed.length;
  const entitiesModified = changes.entities.modified.length;
  const mappingsAdded = changes.mappings.added.length;
  const mappingsRemoved = changes.mappings.removed.length;
  const mappingsModified = changes.mappings.modified.length;

  return {
    totalChanges:
      entitiesAdded +
      entitiesRemoved +
      entitiesModified +
      mappingsAdded +
      mappingsRemoved +
      mappingsModified,
    entities: {
      added: entitiesAdded,
      removed: entitiesRemoved,
      modified: entitiesModified,
    },
    mappings: {
      added: mappingsAdded,
      removed: mappingsRemoved,
      modified: mappingsModified,
    },
  };
}
