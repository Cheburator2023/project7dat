import type { RevealType } from "@react-client/features/json4u/lib/graph/types";

export interface SearchResult {
	revealType: RevealType;
	id: string;
	label: string;
}
