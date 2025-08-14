import { z } from "zod";

export const CreateSnapshotSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().optional(),
	version: z.string().min(1).max(50).optional().default("1.0.0"),
});

export const GetSnapshotListSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
	search: z.string().optional(),
});

export const SnapshotResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	data: z.record(z.any()),
	description: z.string().optional(),
	sourceDataId: z.string(),
	version: z.string(),
	commits: z.array(z.any()).optional(),
	createdAt: z.date(),
});

export const ApplySnapshotSchema = z.object({
	snapshotId: z.string(),
	message: z.string().optional().default("Применение снепшота"),
});

export type CreateSnapshotInput = z.infer<typeof CreateSnapshotSchema>;
export type GetSnapshotListInput = z.infer<typeof GetSnapshotListSchema>;
export type SnapshotResponse = z.infer<typeof SnapshotResponseSchema>;
export type ApplySnapshotInput = z.infer<typeof ApplySnapshotSchema>;
