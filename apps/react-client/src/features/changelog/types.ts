export interface ChangelogTableEntry {
	id: string;
	versionId: string;
	changeDate: string;
	userName: string;
	processName: string;
	objectName: string;
	objectType: string;
	changeType: "added" | "updated" | "deleted";
	beforeData?: Record<string, any> | null;
	afterData?: Record<string, any> | null;
	graphId: string;
	graphName: string;
	author?: string;
	commitId?: string;
	snapshotId?: string;
	version?: string;
	createdAt: string;
}

export interface ChangelogDiff {
	before: Record<string, any> | null;
	after: Record<string, any> | null;
	changeType: "added" | "updated" | "deleted";
}

export interface SortConfig {
	field: keyof ChangelogTableEntry;
	direction: "asc" | "desc";
}

export interface FilterConfig {
	dateFrom: Date | null;
	dateTo: Date | null;
	userName: string;
	processName: string;
	changeType: string;
	objectType: string;
}
