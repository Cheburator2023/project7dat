import { z } from 'zod';
import { PaginationInputSchema, DataLineageListResponseSchema, DataLineageItemSchema, CreateDataLineageItemSchema, UpdateDataLineageItemSchema, CommitDataLineageSchema, } from './api.schema';
export const DataLineageRouterSchema = {
    dataLineage: {
        list: {
            input: PaginationInputSchema,
            output: DataLineageListResponseSchema,
        },
        getById: {
            input: z.object({ id: z.string() }),
            output: DataLineageItemSchema.nullable(),
        },
        getCurrent: {
            input: z.object({}),
            output: DataLineageItemSchema.nullable(),
        },
        create: {
            input: CreateDataLineageItemSchema,
            output: DataLineageItemSchema,
        },
        update: {
            input: z.object({
                id: z.string(),
                data: UpdateDataLineageItemSchema,
            }),
            output: DataLineageItemSchema,
        },
        delete: {
            input: z.object({ id: z.string() }),
            output: z.object({ success: z.boolean() }),
        },
        commit: {
            input: z.object({
                id: z.string(),
                commitData: CommitDataLineageSchema,
            }),
            output: DataLineageItemSchema,
        },
    },
    health: {
        check: {
            input: z.object({}),
            output: z.object({
                status: z.string(),
                timestamp: z.string(),
                service: z.string(),
            }),
        },
    },
};
//# sourceMappingURL=router.schema.js.map