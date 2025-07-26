import { z } from "zod";

export const CreateJsonDataSchema = z.object({
	name: z.string().min(1).max(255),
	data: z.record(z.any()),
	description: z.string().optional(),
});

export const UpdateJsonDataSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	data: z.record(z.any()).optional(),
	description: z.string().optional(),
});

export const JsonDataResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	data: z.record(z.any()),
	description: z.string().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
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
