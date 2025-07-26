import {
	DataLineageGraph,
	LegacyDataLineageGraph,
	DataLineageNode,
	DataLineageEdge,
} from "../types/dataLineage";

export const convertToLegacyFormat = (
	actualData: DataLineageGraph,
): LegacyDataLineageGraph => {
	const nodes: DataLineageNode[] = [];
	const edges: DataLineageEdge[] = [];

	const _nodeIndex = 0;
	let edgeIndex = 0;

	actualData.entities.forEach((entity, index) => {
		const node: DataLineageNode = {
			id: entity.id,
			name: entity.name,
			type: entity.modified ? "destination" : "source",
			description: `${entity.type} в схеме ${entity.namespace || "default"}`,
			metadata: {
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				tags: [entity.type, entity.namespace || "default"],
				schema: entity.attrSeq
					? {
							fields: entity.attrSeq.map((attr) => ({
								name: attr.name,
								type: mapHadoopTypeToStandard(attr.type),
								nullable: true,
								description: attr.comment,
							})),
						}
					: undefined,
				location: `${entity.namespace || "default"}.${entity.name}`,
			},
			position: {
				x: entity.modified ? 800 : 200,
				y: index * 150 + 100,
			},
			status: "active",
		};
		nodes.push(node);
	});

	actualData.mappings.forEach((mapping) => {
		const targetEntity = actualData.entities.find(
			(e) => e.id === mapping.entityId,
		);
		if (!targetEntity || !mapping.deps) return;

		mapping.deps.forEach((dep) => {
			const sourceEntity = actualData.entities.find(
				(e) => e.id === dep.entityId,
			);
			if (!sourceEntity) return;

			const edge: DataLineageEdge = {
				id: `edge_${edgeIndex++}`,
				sourceId: dep.entityId,
				targetId: mapping.entityId,
				type: "data_flow",
				metadata: {
					created: new Date().toISOString(),
					status: "active",
					transformationLogic: generateTransformationLogic(dep),
					frequency: "batch",
				},
			};
			edges.push(edge);
		});
	});

	return {
		id: `lineage_${actualData.desc.appId}`,
		name: actualData.desc.appName,
		description: `Граф линейности данных для приложения ${actualData.desc.appName}`,
		version: "1.0.0",
		created: new Date().toISOString(),
		updated: new Date().toISOString(),
		nodes,
		edges,
		metadata: {
			author: "Система анализа данных",
			environment: "production",
			tags: ["spark", "hadoop", "lineage"],
		},
	};
};

const mapHadoopTypeToStandard = (
	hadoopType: string,
):
	| "string"
	| "number"
	| "boolean"
	| "date"
	| "timestamp"
	| "json"
	| "array" => {
	if (hadoopType.includes("string") || hadoopType.includes("varchar"))
		return "string";
	if (
		hadoopType.includes("int") ||
		hadoopType.includes("decimal") ||
		hadoopType.includes("double") ||
		hadoopType.includes("float")
	)
		return "number";
	if (hadoopType.includes("boolean")) return "boolean";
	if (hadoopType.includes("date")) return "date";
	if (hadoopType.includes("timestamp")) return "timestamp";
	if (hadoopType.includes("array")) return "array";
	if (hadoopType.includes("struct") || hadoopType.includes("map"))
		return "json";
	return "string";
};

const generateTransformationLogic = (dep: any): string => {
	const mappings = dep.attrMaps || [];
	const dependencies = dep.atrDeps || [];

	let logic = `-- Трансформация из ${dep.entityId}\n`;

	if (mappings.length > 0) {
		logic += "-- Маппинг атрибутов:\n";
		mappings.forEach((map: any) => {
			logic += `-- ${map.src} -> ${map.dst}\n`;
		});
	}

	if (dependencies.length > 0) {
		logic += "-- Зависимости атрибутов:\n";
		dependencies.forEach((depAttr: any) => {
			const linkTypes = depAttr.linktypes?.join(", ") || "";
			logic += `-- ${depAttr.attr}: ${linkTypes}\n`;
		});
	}

	return logic;
};
