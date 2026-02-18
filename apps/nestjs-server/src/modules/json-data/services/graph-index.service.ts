import { Injectable, Logger } from "@nestjs/common";
import * as os from "node:os";
import * as path from "node:path";
import Piscina from "src/shared/piscina";
// import Piscina from "piscina";

export interface GraphIndex {
	nodeIds: string[];
	idToIndex: Record<string, number>;
	/** adjTarget[i] = upstream node indices (nodes that feed into node i) */
	adjTarget: number[][];
	/** adjSource[i] = downstream node indices (nodes that node i feeds into) */
	adjSource: number[][];
	/** mappingsByTarget[entityId] = indices into allMappings */
	mappingIndicesByTarget: Map<string, number[]>;
	/** mappingsBySource[entityId] = indices into allMappings */
	mappingIndicesBySource: Map<string, number[]>;
}

@Injectable()
export class GraphIndexService {
	private readonly logger = new Logger(GraphIndexService.name);
	private cachedIndex: GraphIndex | null = null;
	private readonly pool: Piscina;

	constructor() {
		const workerPath = path.resolve(__dirname, "bfs.worker.js");
		this.pool = new Piscina({
			filename: workerPath,
			minThreads: 1,
			maxThreads: Math.max(2, (os.cpus().length ?? 4) - 1),
			idleTimeout: 30_000,
		});
	}

	/**
	 * Build and cache the adjacency index from raw mappings.
	 * Call this whenever the export cache is refreshed.
	 */
	buildIndex(
		mappings: Array<{ entityId: string; deps?: Array<{ entityId: string }> }>,
	): GraphIndex {
		const startTime = Date.now();

		// Collect all unique entity ids
		const idSet = new Set<string>();
		for (const mapping of mappings) {
			idSet.add(mapping.entityId);
			for (const dep of mapping.deps ?? []) {
				idSet.add(dep.entityId);
			}
		}

		const nodeIds = Array.from(idSet);
		const idToIndex: Record<string, number> = Object.create(null);
		for (let i = 0; i < nodeIds.length; i++) {
			idToIndex[nodeIds[i]] = i;
		}

		const n = nodeIds.length;
		const adjTarget: number[][] = Array.from({ length: n }, () => []);
		const adjSource: number[][] = Array.from({ length: n }, () => []);
		const mappingIndicesByTarget = new Map<string, number[]>();
		const mappingIndicesBySource = new Map<string, number[]>();

		for (let mi = 0; mi < mappings.length; mi++) {
			const mapping = mappings[mi];
			const targetIdx = idToIndex[mapping.entityId];

			if (!mappingIndicesByTarget.has(mapping.entityId)) {
				mappingIndicesByTarget.set(mapping.entityId, []);
			}
			mappingIndicesByTarget.get(mapping.entityId)!.push(mi);

			for (const dep of mapping.deps ?? []) {
				const sourceIdx = idToIndex[dep.entityId];
				if (sourceIdx === undefined) continue;

				// dep.entityId → mapping.entityId (upstream → target)
				if (!adjSource[sourceIdx].includes(targetIdx)) {
					adjSource[sourceIdx].push(targetIdx);
				}
				if (!adjTarget[targetIdx].includes(sourceIdx)) {
					adjTarget[targetIdx].push(sourceIdx);
				}

				if (!mappingIndicesBySource.has(dep.entityId)) {
					mappingIndicesBySource.set(dep.entityId, []);
				}
				mappingIndicesBySource.get(dep.entityId)!.push(mi);
			}
		}

		this.cachedIndex = {
			nodeIds,
			idToIndex,
			adjTarget,
			adjSource,
			mappingIndicesByTarget,
			mappingIndicesBySource,
		};

		this.logger.debug(
			`GraphIndex built: ${n} nodes, ${mappings.length} mappings in ${Date.now() - startTime}ms`,
		);

		return this.cachedIndex;
	}

	getIndex(): GraphIndex | null {
		return this.cachedIndex;
	}

	invalidate(): void {
		this.cachedIndex = null;
	}

	/**
	 * Run BFS in a worker thread via Piscina.
	 * Returns the set of all reachable entity ids (including root).
	 */
	async bfs(entityId: string, index: GraphIndex): Promise<Set<string>> {
		const { visitedIds } = await this.pool.run({
			entityId,
			nodeIds: index.nodeIds,
			adjTarget: index.adjTarget,
			adjSource: index.adjSource,
			idToIndex: index.idToIndex,
		});
		return new Set<string>(visitedIds);
	}
}
