import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { DataLineageMapping } from "@react-client/types/dataLineage";
import type { EntityNodeData, JsonSchemaType } from "../types";
import {
	NODE_WIDTH,
	NODE_HEADER_HEIGHT,
	ATTR_ROW_HEIGHT,
	MAX_VISIBLE_ATTRS,
} from "../constants";

// ============================================================================
// Graph Layout Utilities
// ============================================================================

type EntityNode = Node<EntityNodeData, "entityNode">;

export const getLayoutedElements = (
	nodes: EntityNode[],
	edges: Edge[],
	direction: "LR" | "TB" = "LR",
	options?: {
		fixedNodeHeight?: number;
		showAttributesInNodes?: boolean;
	},
) => {
	const fixedNodeHeight = options?.fixedNodeHeight;
	const showAttributesInNodes = options?.showAttributesInNodes ?? true;
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	// Use smaller spacing when attributes are hidden
	const nodesep = showAttributesInNodes ? 80 : 50;
	const ranksep = showAttributesInNodes ? 150 : 100;

	dagreGraph.setGraph({
		rankdir: direction,
		nodesep,
		ranksep,
		marginx: 50,
		marginy: 50,
	});

	const getNodeHeight = (node: EntityNode) => {
		if (fixedNodeHeight !== undefined) return fixedNodeHeight;

		// If attributes are hidden globally, use minimal height (just header)
		if (!showAttributesInNodes) {
			return NODE_HEADER_HEIGHT;
		}

		const layoutAttrLimit = (
			node.data as unknown as { layoutAttrLimit?: unknown }
		).layoutAttrLimit;
		if (typeof layoutAttrLimit === "number") {
			const layoutHasMoreRelatedAttrs = (
				node.data as unknown as { layoutHasMoreRelatedAttrs?: unknown }
			).layoutHasMoreRelatedAttrs;
			return (
				NODE_HEADER_HEIGHT +
				Math.min(layoutAttrLimit, MAX_VISIBLE_ATTRS) * ATTR_ROW_HEIGHT +
				(layoutHasMoreRelatedAttrs === true ? 24 : 0)
			);
		}
		// Calculate visible attrs count from related attributes (source + target + selected), limited by MAX_VISIBLE_ATTRS
		const sourceAttrs = node.data.highlightedSourceAttrs || new Set();
		const targetAttrs = node.data.highlightedTargetAttrs || new Set();
		const selectedAttrs = node.data.selectedHighlightedAttrs || new Set();
		const relatedAttrsCount = new Set([
			...sourceAttrs,
			...targetAttrs,
			...selectedAttrs,
		]).size;
		const visibleAttrsCount = Math.min(relatedAttrsCount, MAX_VISIBLE_ATTRS);
		return (
			NODE_HEADER_HEIGHT +
			visibleAttrsCount * ATTR_ROW_HEIGHT +
			(relatedAttrsCount > MAX_VISIBLE_ATTRS ? 24 : 0)
		);
	};

	nodes.forEach((node) => {
		const height = getNodeHeight(node);
		dagreGraph.setNode(node.id, { width: NODE_WIDTH, height });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});
	dagre.layout(dagreGraph);

	return {
		nodes: nodes.map((node) => {
			const nodeWithPosition = dagreGraph.node(node.id);
			const height = getNodeHeight(node);
			return {
				...node,
				position: {
					x: nodeWithPosition.x - NODE_WIDTH / 2,
					y: nodeWithPosition.y - height / 2,
				},
			};
		}),
		edges,
	};
};

// ============================================================================
// Build Lineage Graph Utilities
// ============================================================================

export const buildLineageGraph = (mappings: DataLineageMapping[]) => {
	const upstream = new Map<string, Set<string>>();
	const downstream = new Map<string, Set<string>>();

	mappings.forEach((mapping) => {
		if (!mapping.deps) return;
		mapping.deps.forEach((dep) => {
			if (!upstream.has(mapping.entityId))
				upstream.set(mapping.entityId, new Set());
			upstream.get(mapping.entityId)!.add(dep.entityId);
			if (!downstream.has(dep.entityId))
				downstream.set(dep.entityId, new Set());
			downstream.get(dep.entityId)!.add(mapping.entityId);
		});
	});

	return { upstream, downstream };
};

export const getUpstreamNodes = (
	nodeId: string,
	upstreamGraph: Map<string, Set<string>>,
	visited = new Set<string>(),
): Set<string> => {
	if (visited.has(nodeId)) return visited;
	visited.add(nodeId);
	const parents = upstreamGraph.get(nodeId);
	if (parents) {
		for (const parent of parents) {
			getUpstreamNodes(parent, upstreamGraph, visited);
		}
	}
	return visited;
};

export const getDownstreamNodes = (
	nodeId: string,
	downstreamGraph: Map<string, Set<string>>,
	visited = new Set<string>(),
): Set<string> => {
	if (visited.has(nodeId)) return visited;
	visited.add(nodeId);
	const children = downstreamGraph.get(nodeId);
	if (children) {
		for (const child of children) {
			getDownstreamNodes(child, downstreamGraph, visited);
		}
	}
	return visited;
};

// ============================================================================
// JSON Schema Inference Utilities
// ============================================================================

export function inferJsonSchema(value: unknown, maxDepth = 5): JsonSchemaType {
	if (maxDepth <= 0) {
		return { type: "object", properties: {} };
	}

	if (value === null || value === undefined) {
		return { type: "null" };
	}

	if (typeof value === "boolean") {
		return { type: "boolean" };
	}

	if (typeof value === "number") {
		return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
	}

	if (typeof value === "string") {
		return { type: "string" };
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return { type: "array", items: { type: "null" } };
		}
		// Merge schemas from all array items
		const itemSchemas = value
			.slice(0, 10)
			.map((item) => inferJsonSchema(item, maxDepth - 1));
		const mergedItems = mergeSchemas(itemSchemas);
		return { type: "array", items: mergedItems };
	}

	if (typeof value === "object") {
		const properties: Record<string, JsonSchemaType> = {};
		for (const [key, val] of Object.entries(value)) {
			properties[key] = inferJsonSchema(val, maxDepth - 1);
		}
		return { type: "object", properties };
	}

	return { type: "string" };
}

export function mergeSchemas(schemas: JsonSchemaType[]): JsonSchemaType {
	if (schemas.length === 0) return { type: "null" };
	if (schemas.length === 1) return schemas[0];

	const types = new Set<string>();
	const allProperties: Record<string, JsonSchemaType[]> = {};
	const arrayItems: JsonSchemaType[] = [];

	for (const schema of schemas) {
		types.add(schema.type);
		if (schema.type === "object" && "properties" in schema) {
			for (const [key, val] of Object.entries(schema.properties)) {
				if (!allProperties[key]) allProperties[key] = [];
				allProperties[key].push(val);
			}
		}
		if (schema.type === "array" && "items" in schema) {
			arrayItems.push(schema.items);
		}
	}

	// If all same type
	if (types.size === 1) {
		const type = schemas[0].type;
		if (type === "object") {
			const mergedProps: Record<string, JsonSchemaType> = {};
			for (const [key, vals] of Object.entries(allProperties)) {
				mergedProps[key] = mergeSchemas(vals);
			}
			return { type: "object", properties: mergedProps };
		}
		if (type === "array" && arrayItems.length > 0) {
			return { type: "array", items: mergeSchemas(arrayItems) };
		}
		return schemas[0];
	}

	return { type: "mixed", types: [...types] };
}

export function formatSchema(schema: JsonSchemaType, indent = 0): string {
	const pad = "  ".repeat(indent);
	const pad1 = "  ".repeat(indent + 1);

	if (schema.type === "object" && "properties" in schema) {
		const props = Object.entries(schema.properties);
		if (props.length === 0) return `${pad}{ "type": "object" }`;
		const propsStr = props
			.map(([key, val]) => {
				if (val.type === "object" || val.type === "array") {
					return `${pad1}"${key}": {\n${formatSchema(val, indent + 2)}\n${pad1}}`;
				}
				return `${pad1}"${key}": { "type": "${val.type}"${val.type === "mixed" && "types" in val ? `, "types": [${val.types.map((t) => `"${t}"`).join(", ")}]` : ""} }`;
			})
			.join(",\n");
		return `${pad}"type": "object",\n${pad}"properties": {\n${propsStr}\n${pad}}`;
	}

	if (schema.type === "array" && "items" in schema) {
		if (schema.items.type === "object" || schema.items.type === "array") {
			return `${pad}"type": "array",\n${pad}"items": {\n${formatSchema(schema.items, indent + 1)}\n${pad}}`;
		}
		return `${pad}"type": "array",\n${pad}"items": { "type": "${schema.items.type}" }`;
	}

	if (schema.type === "mixed" && "types" in schema) {
		return `${pad}"type": "mixed",\n${pad}"types": [${schema.types.map((t) => `"${t}"`).join(", ")}]`;
	}

	return `${pad}"type": "${schema.type}"`;
}
