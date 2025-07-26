import type { DataLineageGraph } from "@react-client/types/dataLineage";

export interface Position {
	line: number;
	column: number;
}

export function findNodePositionInJson(
	jsonText: string,
	nodeId: string,
	graph: DataLineageGraph | null,
): Position | null {
	if (!graph || !nodeId) return null;

	const entity = graph.entities.find((e) => e.id === nodeId);
	if (!entity) return null;

	const lines = jsonText.split("\n");
	const _currentLine = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line.includes(`"id": "${nodeId}"`)) {
			return { line: i + 1, column: 1 };
		}

		if (line.includes(`"name": "${entity.name}"`)) {
			for (
				let j = Math.max(0, i - 10);
				j <= Math.min(lines.length - 1, i + 10);
				j++
			) {
				if (lines[j].includes(`"id": "${nodeId}"`)) {
					return { line: j + 1, column: 1 };
				}
			}
		}
	}

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
