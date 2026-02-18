/**
 * Piscina BFS worker — runs in a separate thread.
 *
 * Input (task):
 *   entityId   : string          — root node
 *   nodeIds    : string[]        — all node ids (index → id)
 *   adjTarget  : number[][]      — adjacency list: for each node index, list of upstream node indices
 *   adjSource  : number[][]      — adjacency list: for each node index, list of downstream node indices
 *   idToIndex  : Record<string, number>
 *
 * Output:
 *   visitedIds : string[]        — all reachable entity ids (including root)
 */
module.exports = function bfsWorker({
	entityId,
	nodeIds,
	adjTarget,
	adjSource,
	idToIndex,
}) {
	const rootIdx = idToIndex[entityId];
	if (rootIdx === undefined) {
		return { visitedIds: [] };
	}

	const n = nodeIds.length;
	const visited = new Uint8Array(n);
	visited[rootIdx] = 1;

	// Head-pointer queue using a flat Int32Array — O(1) dequeue
	const queue = new Int32Array(n);
	let head = 0;
	let tail = 0;
	queue[tail++] = rootIdx;

	while (head < tail) {
		const cur = queue[head++];

		const upstream = adjTarget[cur];
		if (upstream) {
			for (let i = 0; i < upstream.length; i++) {
				const nb = upstream[i];
				if (!visited[nb]) {
					visited[nb] = 1;
					queue[tail++] = nb;
				}
			}
		}

		const downstream = adjSource[cur];
		if (downstream) {
			for (let i = 0; i < downstream.length; i++) {
				const nb = downstream[i];
				if (!visited[nb]) {
					visited[nb] = 1;
					queue[tail++] = nb;
				}
			}
		}
	}

	const visitedIds = [];
	for (let i = 0; i < n; i++) {
		if (visited[i]) visitedIds.push(nodeIds[i]);
	}

	return { visitedIds };
};
