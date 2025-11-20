import type { DataLineageGraph } from "@react-client/types/dataLineage";
import { fastStringify } from "@react-client/shared/src";

export interface Position {
	line: number;
	column: number;
}

// Cache for position lookups to avoid expensive re-computations
const positionCache = new Map<string, Position | null>();
let lastJsonText = "";
let lastGraphVersion = "";

export function findNodePositionInJson(
	jsonText: string,
	nodeId: string,
	graph: DataLineageGraph | null,
): Position | null {
	if (!graph || !nodeId) return null;

	// Create a cache key based on graph content and nodeId
	const graphVersion = fastStringify(
		graph.entities.map((e) => ({ id: e.id, name: e.name })),
	);
	const cacheKey = `${nodeId}-${graphVersion}`;

	// Clear cache if JSON text or graph has changed significantly
	if (jsonText !== lastJsonText || graphVersion !== lastGraphVersion) {
		positionCache.clear();
		lastJsonText = jsonText;
		lastGraphVersion = graphVersion;
	}

	// Return cached result if available
	if (positionCache.has(cacheKey)) {
		return positionCache.get(cacheKey) || null;
	}

	const entity = graph.entities.find((e) => e.id === nodeId);
	if (!entity) {
		positionCache.set(cacheKey, null);
		return null;
	}

	// Use more efficient search with regex
	const idPattern = new RegExp(
		`"id"\\s*:\\s*"${nodeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
		"g",
	);
	const lines = jsonText.split("\n");

	for (let i = 0; i < lines.length; i++) {
		if (idPattern.test(lines[i])) {
			const position = { line: i + 1, column: 1 };
			positionCache.set(cacheKey, position);
			return position;
		}
	}

	// Fallback to name-based search with limited scope
	const namePattern = new RegExp(
		`"name"\\s*:\\s*"${entity?.name?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
	);
	for (let i = 0; i < lines.length; i++) {
		if (namePattern.test(lines[i])) {
			// Search in a smaller window around the name match
			for (
				let j = Math.max(0, i - 5);
				j <= Math.min(lines.length - 1, i + 5);
				j++
			) {
				if (idPattern.test(lines[j])) {
					const position = { line: j + 1, column: 1 };
					positionCache.set(cacheKey, position);
					return position;
				}
			}
		}
	}

	positionCache.set(cacheKey, null);
	return null;
}

export function findNodeByPosition(
	jsonText: string,
	position: Position,
	graph: DataLineageGraph | null,
): string | null {
	if (!graph || !position) return null;

	const lines = jsonText.split("\n");
	const currentLine = lines[position.line - 1];

	if (!currentLine) return null;

	const idMatch = currentLine.match(/"id":\s*"([^"]+)"/);
	if (idMatch) {
		const entityId = idMatch[1];
		const entity = graph.entities.find((e) => e.id === entityId);
		return entity ? entityId : null;
	}

	for (let i = position.line - 1; i >= 0; i--) {
		const line = lines[i];
		const idMatch = line.match(/"id":\s*"([^"]+)"/);
		if (idMatch) {
			const entityId = idMatch[1];
			const entity = graph.entities.find((e) => e.id === entityId);
			if (entity) {
				for (let j = i; j < Math.min(lines.length, i + 20); j++) {
					if (j >= position.line - 1) {
						return entityId;
					}
				}
			}
		}
	}

	return null;
}
