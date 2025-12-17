export interface ObjectItem {
	id: string;
	graphId?: string;
	object: string;
	objectType: "Источник" | "Витрина" | "Признак";
	description: string;
	modelId: string;
	database: string;
	process: string;
	processDescription: string;
}

export interface AttributeConnection {
	sourceEntityId: string;
	sourceEntityName: string;
	sourceAttr: string;
	targetEntityId: string;
	targetEntityName: string;
	targetAttr: string;
	graphId: string;
}
