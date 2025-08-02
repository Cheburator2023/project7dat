import { z } from 'zod';
export const DataLineageDescriptionSchema = z.object({
    appId: z.string().describe('applicationId spark приложения'),
    appName: z.string().describe('applicationName spark приложения'),
});
export const DataLineageAttributeSchema = z.object({
    name: z.string().describe('наименование атрибута в HADOOP'),
    type: z.string().describe('тип данных атрибута в HADOOP'),
    comment: z.string().optional().describe('комментарий к атрибуту в метаданных HADOOP'),
});
export const DataLineageEntitySchema = z.object({
    id: z.string().describe('наименование сущности в HADOOP'),
    modified: z.boolean().describe('флаг изменяемой сущности (true - таргет, false - источник)'),
    type: z.enum(['table', 'view']).describe('тип сущности в HADOOP'),
    namespace: z.string().optional().describe('наименование схемы в HADOOP'),
    name: z.string().describe('наименование витрины в HADOOP'),
    attrSeq: z.array(DataLineageAttributeSchema).optional(),
});
export const AttributeMappingSchema = z.object({
    src: z.string().describe('наименование атрибут источник'),
    dst: z.string().describe('наименование атрибут таргет'),
});
export const AttributeDependencySchema = z.object({
    attr: z.string().describe('наименование атрибут источник'),
    linktypes: z.array(z.enum(['window', 'join', 'where', 'groupby'])).optional().describe('для чего используется данный атрибут'),
});
export const EntityDependencySchema = z.object({
    entityId: z.string().describe('наименование витрины источник в HADOOP'),
    attrMaps: z.array(AttributeMappingSchema).optional(),
    atrDeps: z.array(AttributeDependencySchema).optional(),
});
export const DataLineageMappingSchema = z.object({
    id: z.number().int().describe('порядковый номер витрины таргет'),
    entityId: z.string().describe('наименование сущности таргет в HADOOP'),
    deps: z.array(EntityDependencySchema).optional(),
    unmatched: z.array(z.unknown()).optional().describe('несопоставленные сущности внутри скрипта'),
});
export const DataLineageGraphSchema = z.object({
    desc: DataLineageDescriptionSchema.describe('данные spark приложения'),
    entities: z.array(DataLineageEntitySchema).describe('информация о сущностях (источники и таргет)'),
    mappings: z.array(DataLineageMappingSchema).describe('маппинг витрина источник -> витрина таргет'),
});
export const CreateDataLineageGraphSchema = DataLineageGraphSchema;
export const UpdateDataLineageGraphSchema = DataLineageGraphSchema.partial();
//# sourceMappingURL=data-lineage.schema.js.map