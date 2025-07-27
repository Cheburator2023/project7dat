import { z } from "zod";

export const CommitJsonDataSchema = z.object({
	message: z.string().min(1).max(500),
	diff: z.record(z.any()),
});

export const JsonCommitResponseSchema = z.object({
	id: z.string(),
	hash: z.string(),
	message: z.string(),
	diff: z.record(z.any()),
	fullData: z.record(z.any()),
	jsonDataId: z.string(),
	createdAt: z.date(),
});

export const GetCommitListSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
	jsonDataId: z.string().optional(),
});

export type CommitJsonDataInput = z.infer<typeof CommitJsonDataSchema>;
export type JsonCommitResponse = z.infer<typeof JsonCommitResponseSchema>;
export type GetCommitListInput = z.infer<typeof GetCommitListSchema>;
