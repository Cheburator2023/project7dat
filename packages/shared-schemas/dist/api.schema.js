import { z } from 'zod';
import { DataLineageGraphSchema, CreateDataLineageGraphSchema, UpdateDataLineageGraphSchema } from './data-lineage.schema';
export const PaginationInputSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
});
export const PaginationResponseSchema = z.object({
    data: z.array(z.unknown()),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
});
export const DataLineageItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    data: DataLineageGraphSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const DataLineageListResponseSchema = PaginationResponseSchema.extend({
    data: z.array(DataLineageItemSchema),
});
export const CreateDataLineageItemSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    data: CreateDataLineageGraphSchema,
});
export const UpdateDataLineageItemSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    data: UpdateDataLineageGraphSchema.optional(),
});
export const CommitDataLineageSchema = z.object({
    message: z.string().min(1).max(500),
    data: DataLineageGraphSchema,
});
export const ErrorResponseSchema = z.object({
    statusCode: z.number(),
    message: z.union([z.string(), z.array(z.string())]),
    timestamp: z.string(),
    path: z.string().optional(),
});
//# sourceMappingURL=api.schema.js.map