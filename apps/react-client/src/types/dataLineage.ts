// Re-export shared schema types for frontend usage
export type {
	DataLineageSchema,
	DataLineageEntity,
	DataLineageAttribute,
	DataLineageMapping,
	DataLineageDependency,
	DataLineageAttributeMapping,
	DataLineageAttributeDependency,
	DataLineageAppDescription,
	DataLineageLinkType,
	DataLineageEntityType,
} from "@data-lineage/shared-schemas";

export {
	dataLineageSchema,
	dataLineageJsonSchema,
	isDataLineageSchema,
	isDataLineageEntity,
} from "@data-lineage/shared-schemas";

// Legacy interfaces - keeping for backward compatibility
export interface DataLineageDescription {
	appId: string;
	appName: string;
}

export interface AttributeMapping {
	src: string;
	dst: string;
}

export interface AttributeDependency {
	attr: string;
	linkTypes?: ("window" | "join" | "where" | "groupby")[];
}

export interface EntityDependency {
	entityId: string;
	attrMaps?: AttributeMapping[];
	atrDeps?: AttributeDependency[];
}

// Import the shared schema types
import type { DataLineageSchema } from "@data-lineage/shared-schemas";

// Frontend-specific graph interface that extends the shared schema
export interface DataLineageGraph extends DataLineageSchema {}

export interface DataLineageNode {
	id: string;
	name: string | null;
	type:
		| "source"
		| "transformation"
		| "destination"
		| "dataset"
		| "model"
		| "view";
	description?: string;
	metadata: {
		owner?: string;
		created: string;
		updated: string;
		tags: string[];
		schema?: DataSchema;
		location?: string;
		size?: number;
		rowCount?: number;
	};
	position: {
		x: number;
		y: number;
	};
	status: "active" | "inactive" | "deprecated" | "error";
}

export interface DataLineageEdge {
	id: string;
	sourceId: string;
	targetId: string;
	type: "data_flow" | "dependency" | "transformation" | "reference";
	metadata: {
		created: string;
		transformationLogic?: string;
		frequency?: "real-time" | "batch" | "on-demand";
		lastRun?: string;
		status: "active" | "inactive" | "failed";
	};
}

export interface DataSchema {
	fields: DataField[];
	primaryKey?: string[];
	foreignKeys?: ForeignKey[];
}

export interface DataField {
	name: string;
	type:
		| "string"
		| "number"
		| "boolean"
		| "date"
		| "timestamp"
		| "json"
		| "array";
	nullable: boolean;
	description?: string;
	constraints?: FieldConstraint[];
}

export interface FieldConstraint {
	type: "unique" | "not_null" | "check" | "default";
	value?: string | number | boolean;
	expression?: string;
}

export interface ForeignKey {
	fields: string[];
	referencedTable: string;
	referencedFields: string[];
}

export interface DataLineageFilter {
	nodeTypes?: DataLineageNode["type"][];
	statuses?: DataLineageNode["status"][];
	tags?: string[];
	owners?: string[];
	dateRange?: {
		start: string;
		end: string;
	};
}

export interface DataLineageSearchResult {
	nodes: DataLineageNode[];
	edges: DataLineageEdge[];
	totalCount: number;
}
