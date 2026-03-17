import { create } from "zustand";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import type { MergeDiffItem } from "@react-client/api/hooks/mergeApi";

interface CommitEntity {
	id: string;
	name?: string | null;
	type?: string;
	modified?: boolean;
	namespace?: string;
	description?: string;
	system_code?: string;
	attrSeq?: Array<{ name: string; type: string; comment?: string }>;
}

interface CommitMapping {
	id?: number | string;
	entityId: string;
	entity_map_id?: number | string;
	system_code?: string;
	deps?: Array<{
		entityId: string;
		system_code?: string;
		process?: string;
		process_id?: number;
		attrMaps?: Array<{ src: string; dst: string }>;
		atrDeps?: Array<{ attr: string; linkTypes?: string[] }>;
	}>;
}

export type MergeStep =
	| "idle"
	| "previewing"
	| "deduplicating"
	| "confirmed"
	| "cancelled";

interface MergeStats {
	changedEntitiesCount: number;
	changedAttributesCount: number;
	changedMappingsCount: number;
}

interface CommitMergeState {
	commit: S2tCommitItem | null;
	sourceType: "SURM" | "DAPP";
	applying: boolean;
	error: string | null;
	selectedEntityId: string | null;
	entitySearch: string;

	mergeStep: MergeStep;
	mergeSessionId: string | null;
	mergeDiff: MergeDiffItem[];
	mergeStats: MergeStats | null;
	hasDuplicates: boolean;
	duplicatesCount: number;
	validationWarnings: string[];

	setCommit: (commit: S2tCommitItem | null) => void;
	setSourceType: (sourceType: "SURM" | "DAPP") => void;
	setApplying: (applying: boolean) => void;
	setError: (error: string | null) => void;
	setSelectedEntityId: (id: string | null) => void;
	setEntitySearch: (search: string) => void;
	setMergeStep: (step: MergeStep) => void;
	setMergeSessionId: (id: string | null) => void;
	setMergeDiff: (diff: MergeDiffItem[]) => void;
	setMergeStats: (stats: MergeStats | null) => void;
	setDuplicateState: (hasDuplicates: boolean, duplicatesCount: number) => void;
	setValidationWarnings: (warnings: string[]) => void;
	reset: () => void;
}

export type { CommitEntity, CommitMapping, MergeStats };

const initialState = {
	commit: null,
	sourceType: "DAPP" as const,
	applying: false,
	error: null,
	selectedEntityId: null,
	entitySearch: "",
	mergeStep: "idle" as MergeStep,
	mergeSessionId: null,
	mergeDiff: [],
	mergeStats: null,
	hasDuplicates: false,
	duplicatesCount: 0,
	validationWarnings: [],
};

export const useCommitMergeStore = create<CommitMergeState>()((set) => ({
	...initialState,
	setCommit: (commit) => set({ commit }),
	setSourceType: (sourceType) => set({ sourceType }),
	setApplying: (applying) => set({ applying }),
	setError: (error) => set({ error }),
	setSelectedEntityId: (id) => set({ selectedEntityId: id }),
	setEntitySearch: (search) => set({ entitySearch: search }),
	setMergeStep: (mergeStep) => set({ mergeStep }),
	setMergeSessionId: (mergeSessionId) => set({ mergeSessionId }),
	setMergeDiff: (mergeDiff) => set({ mergeDiff }),
	setMergeStats: (mergeStats) => set({ mergeStats }),
	setDuplicateState: (hasDuplicates, duplicatesCount) =>
		set({ hasDuplicates, duplicatesCount }),
	setValidationWarnings: (validationWarnings) => set({ validationWarnings }),
	reset: () => set(initialState),
}));

/**
 * Извлечь entities из payload коммита
 */
export const extractCommitEntities = (
	commit: S2tCommitItem | null,
): CommitEntity[] => {
	const payload = commit?.payload as Record<string, unknown> | null;
	if (!payload) return [];
	const entities = (payload.entities ?? []) as CommitEntity[];
	return Array.isArray(entities) ? entities : [];
};

/**
 * Извлечь mappings из payload коммита
 */
export const extractCommitMappings = (
	commit: S2tCommitItem | null,
): CommitMapping[] => {
	const payload = commit?.payload as Record<string, unknown> | null;
	if (!payload) return [];
	const mappings = (payload.mappings ?? []) as CommitMapping[];
	return Array.isArray(mappings) ? mappings : [];
};
