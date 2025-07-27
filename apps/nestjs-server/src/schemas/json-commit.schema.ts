import { z } from "zod";

export const CreateCommitSchema = z.object({
	message: z.string(),
	data: z.record(z.any()),
});

export const JsonCommitResponseSchema = z.object({
	id: z.string(),
	hash: z.string(),
	message: z.string(),
	diff: z.record(z.any()),
	fullData: z.record(z.any()),
	graphId: z.string(),
	createdAt: z.date(),
});

export const GetCommitListSchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(10),
	graphId: z.string().optional(),
});

export type CommitJsonDataInput = z.infer<typeof CreateCommitSchema>;
export type JsonCommitResponse = z.infer<typeof JsonCommitResponseSchema>;
export type GetCommitListInput = z.infer<typeof GetCommitListSchema>;
