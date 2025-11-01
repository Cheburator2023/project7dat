import { z } from "zod";

// Zod schema for the complete data lineage structure
export const DataLineageZodSchema = z.object({
	desc: z.object({
		appId: z.string(),
		appName: z.string(),
	}),
	entities: z.array(
		z.object({
			id: z.string(),
			modified: z.boolean(),
			type: z.enum(["table", "view"]),
			namespace: z.string().optional(),
			name: z.string(),
			attrSeq: z
				.array(
					z.object({
						name: z.string(),
						type: z.string(),
						comment: z.string().optional(),
					}),
				)
				.optional(),
		}),
	),
	mappings: z.array(
		z.object({
			id: z.number(),
			entityId: z.string(),
			deps: z
				.array(
					z.object({
						entityId: z.string(),
						attrMaps: z
							.array(
								z.object({
									src: z.string(),
									dst: z.string(),
								}),
							)
							.optional(),
						atrDeps: z
							.array(
								z.object({
									attr: z.string(),
									linkTypes: z
										.array(z.enum(["window", "join", "where", "groupby"]))
										.optional(),
								}),
							)
							.optional(),
					}),
				)
				.optional(),
			unmatched: z.array(z.any()).optional(),
		}),
	),
});

// Legacy schemas for backward compatibility
export const CreateJsonDataSchema = z.object({
	data: DataLineageZodSchema,
	name: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
	version: z.string().min(1).max(50).optional().default("1.0.0"),
	authorName: z.string().min(1).max(255).optional().default("System"),
});

export const UpdateJsonDataSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	data: DataLineageZodSchema.optional(),
	description: z.string().optional(),
	version: z.string().min(1).max(50).optional(),
	authorName: z.string().min(1).max(255).optional(),
});

export const JsonDataResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	data: DataLineageZodSchema,
	description: z.string().optional(),
	version: z.string(),
	isCurrent: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const SetCurrentJsonDataSchema = z.object({
	id: z.string().uuid(),
});

export const GetJsonDataListSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
	search: z.string().optional(),
});

export type CreateJsonDataInput = z.infer<typeof CreateJsonDataSchema>;
export type UpdateJsonDataInput = z.infer<typeof UpdateJsonDataSchema>;
export type JsonDataResponse = z.infer<typeof JsonDataResponseSchema>;
export type GetJsonDataListInput = z.infer<typeof GetJsonDataListSchema>;
export type SetCurrentJsonDataInput = z.infer<typeof SetCurrentJsonDataSchema>;
