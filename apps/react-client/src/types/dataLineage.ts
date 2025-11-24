// Re-export shared schema types for frontend usage (excluding conflicting ones)
export type {
	DataLineageEntity as BaseDataLineageEntity,
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

// Frontend-specific data lineage types

// Attribute type for data lineage entities
export interface DataLineageAttribute {
	name: string;
	id: string;
	type: string;
	comment?: string;
}

// Frontend-specific entity interface
export interface DataLineageEntity {
	id: string;
	modified: boolean;
	type: "table" | "view" | "rdd" | "unresolved";
	namespace?: string;
	name: string | null;
	description?: string;
	entity_change?: string;
	attrSeq?: DataLineageAttribute[];
}

// Mapping type for data lineage
export interface DataLineageMapping {
	id: number;
	entityId: string;
	deps?: Array<{
		entityId: string;
		attrMaps?: Array<{
			src: string;
			dst: string;
		}>;
		atrDeps?: Array<{
			attr: string;
			linkTypes?: Array<"window" | "join" | "where" | "groupby">;
		}>;
	}>;
	unmatched?: Array<any>;
}

// Schema type for data lineage
export interface DataLineageSchema {
	desc: {
		appId: string;
		appName: string;
	};
	entities: DataLineageEntity[];
	mappings: DataLineageMapping[];
	failedMappings: DataLineageMapping[];
}

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
