import type {
	DataLineageEdge,
	DataLineageNode,
} from "@react-client/types/dataLineage";

export const validateDataLineageNode = (node: any): node is DataLineageNode => {
	return (
		typeof node === "object" &&
		typeof node.id === "string" &&
		typeof node.name === "string" &&
		[
			"source",
			"transformation",
			"destination",
			"dataset",
			"model",
			"view",
		].includes(node.type) &&
		typeof node.metadata === "object" &&
		typeof node.metadata.created === "string" &&
		typeof node.metadata.updated === "string" &&
		Array.isArray(node.metadata.tags) &&
		typeof node.position === "object" &&
		typeof node.position.x === "number" &&
		typeof node.position.y === "number" &&
		["active", "inactive", "deprecated", "error"].includes(node.status)
	);
};

export const validateDataLineageEdge = (edge: any): edge is DataLineageEdge => {
	return (
		typeof edge === "object" &&
		typeof edge.id === "string" &&
		typeof edge.sourceId === "string" &&
		typeof edge.targetId === "string" &&
		["data_flow", "dependency", "transformation", "reference"].includes(
			edge.type,
		) &&
		typeof edge.metadata === "object" &&
		typeof edge.metadata.created === "string" &&
		["active", "inactive", "failed"].includes(edge.metadata.status)
	);
};

export const getNodesByType = (
	nodes: DataLineageNode[],
	type: DataLineageNode["type"],
): DataLineageNode[] => {
	return nodes.filter((node) => node.type === type);
};

export const getEdgesByType = (
	edges: DataLineageEdge[],
	type: DataLineageEdge["type"],
): DataLineageEdge[] => {
	return edges.filter((edge) => edge.type === type);
};

export const findNodeById = (
	nodes: DataLineageNode[],
	id: string,
): DataLineageNode | undefined => {
	return nodes.find((node) => node.id === id);
};

export const findEdgeById = (
	edges: DataLineageEdge[],
	id: string,
): DataLineageEdge | undefined => {
	return edges.find((edge) => edge.id === id);
};

export const getConnectedNodes = (
	nodes: DataLineageNode[],
	edges: DataLineageEdge[],
	nodeId: string,
): { upstream: DataLineageNode[]; downstream: DataLineageNode[] } => {
	const upstreamEdges = edges.filter((edge) => edge.targetId === nodeId);
	const downstreamEdges = edges.filter((edge) => edge.sourceId === nodeId);

	const upstream = upstreamEdges
		.map((edge) => findNodeById(nodes, edge.sourceId))
		.filter((node): node is DataLineageNode => node !== undefined);

	const downstream = downstreamEdges
		.map((edge) => findNodeById(nodes, edge.targetId))
		.filter((node): node is DataLineageNode => node !== undefined);

	return { upstream, downstream };
};

export const calculateNodeDepth = (
	_nodes: DataLineageNode[],
	edges: DataLineageEdge[],
	startNodeId: string,
): Map<string, number> => {
	const depths = new Map<string, number>();
	const visited = new Set<string>();

	const dfs = (nodeId: string, depth: number) => {
		if (visited.has(nodeId)) return;
		visited.add(nodeId);
		depths.set(nodeId, depth);

		const downstreamEdges = edges.filter((edge) => edge.sourceId === nodeId);
		for (const edge of downstreamEdges) {
			dfs(edge.targetId, depth + 1);
		}
	};

	dfs(startNodeId, 0);
	return depths;
};

export const detectCycles = (
	nodes: DataLineageNode[],
	edges: DataLineageEdge[],
): string[][] => {
	const cycles: string[][] = [];
	const visited = new Set<string>();
	const recursionStack = new Set<string>();
	const currentPath: string[] = [];

	const dfs = (nodeId: string): boolean => {
		if (recursionStack.has(nodeId)) {
			const cycleStart = currentPath.indexOf(nodeId);
			cycles.push([...currentPath.slice(cycleStart), nodeId]);
			return true;
		}

		if (visited.has(nodeId)) return false;

		visited.add(nodeId);
		recursionStack.add(nodeId);
		currentPath.push(nodeId);

		const outgoingEdges = edges.filter((edge) => edge.sourceId === nodeId);
		for (const edge of outgoingEdges) {
			if (dfs(edge.targetId)) return true;
		}

		recursionStack.delete(nodeId);
		currentPath.pop();
		return false;
	};

	for (const node of nodes) {
		if (!visited.has(node.id)) {
			dfs(node.id);
		}
	}

	return cycles;
};

export const getNodeMetrics = (node: DataLineageNode) => {
	return {
		hasSchema: !!node.metadata.schema,
		fieldCount: node.metadata.schema?.fields.length || 0,
		hasOwner: !!node.metadata.owner,
		tagCount: node.metadata.tags.length,
		hasLocation: !!node.metadata.location,
		hasSize: !!node.metadata.size,
		hasRowCount: !!node.metadata.rowCount,
	};
};

export const formatBytes = (bytes: number): string => {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const formatRowCount = (count: number): string => {
	if (count >= 1000000) {
		return `${(count / 1000000).toFixed(1)}M`;
	} else if (count >= 1000) {
		return `${(count / 1000).toFixed(1)}K`;
	}
	return count.toString();
};
