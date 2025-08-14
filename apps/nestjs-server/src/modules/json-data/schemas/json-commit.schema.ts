import { z } from "zod";
import { DataLineageZodSchema } from "./json-data.schema";

export const CreateCommitSchema = z.object({
	message: z.string(),
	data: DataLineageZodSchema,
	author: z
		.object({
			id: z.string(),
			username: z.string(),
			email: z.string(),
		})
		.optional(),
});

export const JsonCommitResponseSchema = z.object({
	id: z.string(),
	short_id: z.string(),
	message: z.string(),
	diff: z.record(z.any()), // Keep as any for diff data
	graphId: z.string(),
	author: z
		.object({
			id: z.string(),
			username: z.string(),
			email: z.string(),
		})
		.optional(),
	createdAt: z.date(),
});

export const JsonCommitWithFullDataResponseSchema = z.object({
	id: z.string(),
	short_id: z.string(),
	message: z.string(),
	diff: z.record(z.any()), // Keep as any for diff data
	fullData: DataLineageZodSchema,
	graphId: z.string(),
	author: z
		.object({
			id: z.string(),
			username: z.string(),
			email: z.string(),
		})
		.optional(),
	createdAt: z.date(),
});

export const GetCommitListSchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(10),
	graphId: z.string().optional(),
});

export type CommitJsonDataInput = z.infer<typeof CreateCommitSchema>;
export type JsonCommitResponse = z.infer<typeof JsonCommitResponseSchema>;
export type JsonCommitWithFullDataResponse = z.infer<
	typeof JsonCommitWithFullDataResponseSchema
>;
export type GetCommitListInput = z.infer<typeof GetCommitListSchema>;
