import type {
	DataLineageEdge,
	DataLineageFilter,
	DataLineageGraph,
	DataLineageNode,
	DataLineageSearchResult,
} from "@react-client/types/dataLineage";
import { create } from "zustand";
import { jsonDataService } from "@react-client/api/jsonDataApi";
import type { CommitJsonDataRequest } from "@react-client/api/jsonDataApi";

interface RevealPosition {
	version: number;
	nodeId: string;
	from: "editor" | "graph" | "search";
}

interface DataLineageState {
	currentGraph: DataLineageGraph | null;
	currentGraphId: string | null;
	originalGraph: DataLineageGraph | null;
	hasUnsavedChanges: boolean;
	graphs: DataLineageGraph[];
	selectedNodes: string[];
	selectedEdges: string[];
	filter: DataLineageFilter;
	searchQuery: string;
	searchResults: DataLineageSearchResult | null;
	isLoading: boolean;
	error: string | null;
	viewMode: "graph" | "table" | "json";
	zoomLevel: number;
	panPosition: { x: number; y: number };
	revealPosition: RevealPosition;
	enableSyncScroll: boolean;
}

interface DataLineageActions {
	setCurrentGraph: (graph: DataLineageGraph) => void;
	setCurrentGraphId: (id: string) => void;
	loadGraphFromApi: () => Promise<void>;
	loadGraphFromApiWithId: (id: string) => Promise<void>;
	setGraphs: (graphs: DataLineageGraph[]) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	addNode: (node: Omit<DataLineageNode, "id">) => void;
	updateNode: (nodeId: string, updates: Partial<DataLineageNode>) => void;
	deleteNode: (nodeId: string) => void;
	addEdge: (edge: Omit<DataLineageEdge, "id">) => void;
	updateEdge: (edgeId: string, updates: Partial<DataLineageEdge>) => void;
	deleteEdge: (edgeId: string) => void;
	selectNode: (nodeId: string, multiSelect?: boolean) => void;
	selectEdge: (edgeId: string, multiSelect?: boolean) => void;
	clearSelection: () => void;
	setFilter: (filter: Partial<DataLineageFilter>) => void;
	clearFilter: () => void;
	search: (query: string) => void;
	clearSearch: () => void;
	setViewMode: (mode: "graph" | "table" | "json") => void;
	setZoom: (level: number) => void;
	setPan: (position: { x: number; y: number }) => void;
	resetView: () => void;
	exportGraph: (format: "json" | "csv") => string;
	importGraph: (data: string, format: "json") => Promise<void>;
	setExampleData: (graph: DataLineageGraph) => void;
	setRevealPosition: (pos: Partial<RevealPosition>) => void;
	isNeedReveal: (scene: "editor" | "graph") => boolean;
	setEnableSyncScroll: (enable: boolean) => void;
	markAsChanged: () => void;
	discardChanges: () => void;
	commitChanges: () => void;
	commitChangesWithMessage: (message: string) => Promise<void>;
}

type DataLineageStore = DataLineageState & DataLineageActions;

const initialState: DataLineageState = {
	currentGraph: null,
	currentGraphId: null,
	originalGraph: null,
	hasUnsavedChanges: false,
	graphs: [],
	selectedNodes: [],
	selectedEdges: [],
	filter: {},
	searchQuery: "",
	searchResults: null,
	isLoading: false,
	error: null,
	viewMode: "graph",
	zoomLevel: 1,
	panPosition: { x: 0, y: 0 },
	revealPosition: { version: 0, nodeId: "", from: "editor" },
	enableSyncScroll: true,
};

const generateId = (): string => {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateTimestamp = (): string => {
	return new Date().toISOString();
};

export const useDataLineageStore = create<DataLineageStore>()((set, get) => ({
	...initialState,

	setCurrentGraph: (graph: DataLineageGraph) => {
		const { originalGraph } = get();
		if (!originalGraph) {
			const deepCopy = JSON.parse(JSON.stringify(graph));
			set({
				currentGraph: graph,
				originalGraph: deepCopy,
				hasUnsavedChanges: false,
			});
		} else {
			set({ currentGraph: graph });
			get().markAsChanged();
		}
	},

	setCurrentGraphId: (id: string) => {
		set({ currentGraphId: id });
	},

	loadGraphFromApi: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await jsonDataService.getCurrent();
			if (response?.data) {
				const graph = response.data as DataLineageGraph;
				const deepCopy = JSON.parse(JSON.stringify(graph));
				set({
					currentGraph: graph,
					originalGraph: deepCopy,
					currentGraphId: response.id,
					hasUnsavedChanges: false,
					selectedNodes: [],
					selectedEdges: [],
					error: null,
					isLoading: false,
				});
			} else {
				set({ error: "График не найден", isLoading: false });
			}
		} catch (error) {
			set({ error: `Ошибка загрузки графика: ${error}`, isLoading: false });
		}
	},

	loadGraphFromApiWithId: async (id: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await jsonDataService.getById(id);
			if (response?.data) {
				const graph = response.data as DataLineageGraph;
				const deepCopy = JSON.parse(JSON.stringify(graph));
				set({
					currentGraph: graph,
					originalGraph: deepCopy,
					currentGraphId: id,
					hasUnsavedChanges: false,
					selectedNodes: [],
					selectedEdges: [],
					error: null,
					isLoading: false,
				});
			} else {
				set({ error: "График не найден", isLoading: false });
			}
		} catch (error) {
			set({ error: `Ошибка загрузки графика: ${error}`, isLoading: false });
		}
	},

	setGraphs: (graphs: DataLineageGraph[]) => {
		set({ graphs });
	},

	setLoading: (loading: boolean) => {
		set({ isLoading: loading });
	},

	setError: (error: string | null) => {
		set({ error });
	},

	addNode: (nodeData) => {
		const { currentGraph } = get();
		if (!currentGraph) return;

		const _newNode: DataLineageNode = {
			...nodeData,
			id: generateId(),
			metadata: {
				...nodeData.metadata,
				created: generateTimestamp(),
				updated: generateTimestamp(),
			},
		};

		console.warn(
			"addNode: DataLineageGraph structure doesn't support direct node addition",
		);
		get().markAsChanged();
	},

	updateNode: (_nodeId: string, _updates: Partial<DataLineageNode>) => {
		const { currentGraph } = get();
		if (!currentGraph) return;

		console.warn(
			"updateNode: DataLineageGraph structure doesn't support direct node updates",
		);
		get().markAsChanged();
	},

	deleteNode: (nodeId: string) => {
		const { currentGraph } = get();
		if (!currentGraph) return;

		console.warn(
			"deleteNode: DataLineageGraph structure doesn't support direct node deletion",
		);

		set({
			selectedNodes: get().selectedNodes.filter((id) => id !== nodeId),
		});
		get().markAsChanged();
	},

	addEdge: (edgeData) => {
		const { currentGraph } = get();
		if (!currentGraph) return;

		const _newEdge: DataLineageEdge = {
			...edgeData,
			id: generateId(),
			metadata: {
				...edgeData.metadata,
				created: generateTimestamp(),
			},
		};

		console.warn(
			"addEdge: DataLineageGraph structure doesn't support direct edge addition",
		);
		get().markAsChanged();
	},

	updateEdge: (_edgeId: string, _updates: Partial<DataLineageEdge>) => {
		const { currentGraph } = get();
		if (!currentGraph) return;

		console.warn(
			"updateEdge: DataLineageGraph structure doesn't support direct edge updates",
		);
		get().markAsChanged();
	},

	deleteEdge: (edgeId: string) => {
		const { currentGraph } = get();
		if (!currentGraph) return;

		console.warn(
			"deleteEdge: DataLineageGraph structure doesn't support direct edge deletion",
		);

		set({
			selectedEdges: get().selectedEdges.filter((id) => id !== edgeId),
		});
		get().markAsChanged();
	},

	selectNode: (nodeId: string, multiSelect = false) => {
		const { selectedNodes, setRevealPosition } = get();

		if (multiSelect) {
			const isSelected = selectedNodes.includes(nodeId);
			const newSelection = isSelected
				? selectedNodes.filter((id) => id !== nodeId)
				: [...selectedNodes, nodeId];
			set({ selectedNodes: newSelection });
		} else {
			set({ selectedNodes: [nodeId] });
		}

		if (nodeId) {
			setRevealPosition({ nodeId, from: "graph" });
		}
	},

	selectEdge: (edgeId: string, multiSelect = false) => {
		const { selectedEdges } = get();

		if (multiSelect) {
			const isSelected = selectedEdges.includes(edgeId);
			const newSelection = isSelected
				? selectedEdges.filter((id) => id !== edgeId)
				: [...selectedEdges, edgeId];
			set({ selectedEdges: newSelection });
		} else {
			set({ selectedEdges: [edgeId] });
		}
	},

	clearSelection: () => {
		set({ selectedNodes: [], selectedEdges: [] });
	},

	setFilter: (filterUpdates: Partial<DataLineageFilter>) => {
		const { filter } = get();
		set({ filter: { ...filter, ...filterUpdates } });
	},

	clearFilter: () => {
		set({ filter: {} });
	},

	search: (query: string) => {
		const { currentGraph } = get();
		if (!currentGraph) {
			set({ searchQuery: query, searchResults: null });
			return;
		}

		const searchResults: DataLineageSearchResult = {
			nodes: [],
			edges: [],
			totalCount: 0,
		};

		set({ searchQuery: query, searchResults });
	},

	clearSearch: () => {
		set({ searchQuery: "", searchResults: null });
	},

	setViewMode: (mode: "graph" | "table" | "json") => {
		set({ viewMode: mode });
	},

	setZoom: (level: number) => {
		set({ zoomLevel: Math.max(0.1, Math.min(3, level)) });
	},

	setPan: (position: { x: number; y: number }) => {
		set({ panPosition: position });
	},

	resetView: () => {
		set({ zoomLevel: 1, panPosition: { x: 0, y: 0 } });
	},

	exportGraph: (format: "json" | "csv") => {
		const { currentGraph } = get();
		if (!currentGraph) return "";

		if (format === "json") {
			return JSON.stringify(currentGraph, null, 2);
		} else {
			const headers = ["id", "name", "type", "namespace"];
			const rows = currentGraph.entities.map((entity) => [
				entity.id,
				entity.name,
				entity.type,
				entity.namespace || "",
			]);

			return [headers, ...rows].map((row) => row.join(",")).join("\n");
		}
	},

	importGraph: async (data: string, format: "json") => {
		set({ isLoading: true, error: null });
		try {
			if (format === "json") {
				const parsedData = JSON.parse(data);

				if (parsedData.desc && parsedData.entities && parsedData.mappings) {
					const graph = parsedData as DataLineageGraph;
					const deepCopy = JSON.parse(JSON.stringify(graph));
					set({
						currentGraph: graph,
						originalGraph: deepCopy,
						hasUnsavedChanges: false,
						selectedNodes: [],
						selectedEdges: [],
						error: null,
						isLoading: false,
					});
				} else {
					throw new Error("Неподдерживаемый формат данных");
				}
			}
		} catch (error) {
			set({ error: `Ошибка импорта графика: ${error}`, isLoading: false });
		}
	},

	setExampleData: (graph: DataLineageGraph) => {
		const deepCopy = JSON.parse(JSON.stringify(graph));
		set({
			currentGraph: graph,
			originalGraph: deepCopy,
			hasUnsavedChanges: false,
			selectedNodes: [],
			selectedEdges: [],
			error: null,
		});
	},

	setRevealPosition: (pos: Partial<RevealPosition>) => {
		const oldPos = get().revealPosition;
		const needUpdate = !(
			oldPos.nodeId === pos.nodeId && oldPos.from === pos.from
		);

		if (needUpdate) {
			const newPos = {
				...oldPos,
				...pos,
				version: oldPos.version + 1,
			};
			set({
				revealPosition: newPos,
			});
		}
	},

	isNeedReveal: (scene: "editor" | "graph") => {
		const {
			enableSyncScroll,
			revealPosition: { from },
		} = get();

		if (scene === "editor") {
			return enableSyncScroll ? from !== "editor" : from === "search";
		} else if (scene === "graph") {
			return enableSyncScroll ? from !== "graph" : from === "search";
		}

		return false;
	},

	setEnableSyncScroll: (enable: boolean) => {
		set({ enableSyncScroll: enable });
	},

	markAsChanged: () => {
		set({ hasUnsavedChanges: true });
	},

	discardChanges: () => {
		const { originalGraph } = get();
		set({
			currentGraph: originalGraph,
			hasUnsavedChanges: false,
		});
	},

	commitChanges: () => {
		const { currentGraph } = get();
		set({
			originalGraph: currentGraph,
			hasUnsavedChanges: false,
		});
	},

	commitChangesWithMessage: async (message: string) => {
		const { currentGraph, currentGraphId } = get();
		if (!currentGraph) {
			throw new Error("Нет данных для коммита");
		}

		try {
			set({ isLoading: true, error: null });

			const commitData: CommitJsonDataRequest = {
				message,
				data: currentGraph,
			};

			if (currentGraphId) {
				await jsonDataService.commitUpdate(currentGraphId, commitData);
			} else {
				await jsonDataService.commitCurrent(commitData);
			}

			set({
				originalGraph: JSON.parse(JSON.stringify(currentGraph)),
				hasUnsavedChanges: false,
				isLoading: false,
			});
		} catch (error) {
			set({
				error: `Ошибка при сохранении коммита: ${error}`,
				isLoading: false,
			});
			throw error;
		}
	},
}));
