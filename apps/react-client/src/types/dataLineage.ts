export interface DataLineageNode {
	id: string;
	name: string;
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

export interface DataLineageGraph {
	id: string;
	name: string;
	description?: string;
	version: string;
	created: string;
	updated: string;
	nodes: DataLineageNode[];
	edges: DataLineageEdge[];
	metadata: {
		author: string;
		environment: "development" | "staging" | "production";
		tags: string[];
	};
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
