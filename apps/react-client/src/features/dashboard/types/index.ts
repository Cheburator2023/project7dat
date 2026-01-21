import type { DataLineageEntity } from "@react-client/types/dataLineage";

// ============================================================================
// Entity Row Types
// ============================================================================

export interface EntityRow {
	id: string;
	graphId: string;
	name: string;
	type: string;
	namespace: string;
	attributeCount: number;
	upstreamCount: number;
	downstreamCount: number;
	isDataMart: boolean;
	isSource: boolean;
	modified: boolean;
}

export interface ObjectRow {
	id: string;
	graphId: string;
	name: string;
	objectType: "Источник" | "Витрина" | "Признак";
	parentEntity: string;
	dataType?: string;
	description: string;
}

export interface LinkRow {
	id: string;
	graphId: string;
	sourceEntity: string;
	sourceName: string;
	targetEntity: string;
	targetName: string;
	attrMappingsCount: number;
	attrMaps: Array<{ src: string; dst: string }>;
}

// ============================================================================
// Connection Types
// ============================================================================

export interface EntityConnection {
	id: string;
	sourceId: string;
	targetId: string;
	sourceName: string;
	targetName: string;
	attrMaps: Array<{ src: string; dst: string }>;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface FilterState {
	entityTypes: string[];
	modifiedOnly: boolean;
	namespaces: string[];
	hasUpstream: "any" | "yes" | "no";
	hasDownstream: "any" | "yes" | "no";
	attrCountMin: string;
	attrCountMax: string;
}

export const initialFilters: FilterState = {
	entityTypes: [],
	modifiedOnly: false,
	namespaces: [],
	hasUpstream: "any",
	hasDownstream: "any",
	attrCountMin: "",
	attrCountMax: "",
};

// ============================================================================
// Highlight Types
// ============================================================================

export interface HighlightedAttribute {
	entityId: string;
	attrName: string;
}

// ============================================================================
// Graph Node Types
// ============================================================================

export interface EntityNodeData {
	entity: DataLineageEntity;
	highlightType:
		| "none"
		| "selected"
		| "upstream"
		| "downstream"
		| "searchMatch";
	onNodeClick: (id: string) => void;
	onNodeDoubleClick: (id: string, graphId: string) => void;
	onAttrHover: (entityId: string, attrName: string | null) => void;
	onAttrClick: (entityId: string, attrName: string) => void;
	graphId: string;
	upstreamCount: number;
	downstreamCount: number;
	highlightedSourceAttrs?: Set<string>;
	highlightedTargetAttrs?: Set<string>;
	hoverHighlightedAttrs?: Set<string>;
	selectedHighlightedAttrs?: Set<string>;
	isSearchActive?: boolean;
	isSearchMatch?: boolean;
	searchMatchScore?: number;
	showAllAttrs?: boolean;
	isExpanded?: boolean;
	onToggleExpand?: (id: string) => void;
	[key: string]: unknown;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchResultItem {
	id: string;
	graphId: string;
	name: string;
	type: string;
	namespace?: string;
	matchedField: "name" | "type" | "namespace" | "attribute";
	matchedValue: string;
	isDataMart?: boolean;
	isSource?: boolean;
	modified?: boolean;
}

// ============================================================================
// Debug Types
// ============================================================================

export interface DebugIssue {
	type: "error" | "warning";
	category: string;
	message: string;
	location: string;
	details?: string;
}

// JSON Schema type for inferred schema
export type JsonSchemaType =
	| { type: "null" }
	| { type: "boolean" }
	| { type: "integer" }
	| { type: "number" }
	| { type: "string" }
	| { type: "array"; items: JsonSchemaType }
	| { type: "object"; properties: Record<string, JsonSchemaType> }
	| { type: "mixed"; types: string[] };
