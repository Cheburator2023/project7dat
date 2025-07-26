import type {
	DataLineageEdge,
	DataLineageFilter,
	DataLineageGraph,
	DataLineageNode,
	DataLineageSearchResult,
} from "@react-client/types/dataLineage";
import { jsonDataService } from "@react-client/api/jsonDataApi";
import { create } from "zustand";

interface RevealPosition {
	version: number;
	nodeId: string;
	from: "editor" | "graph" | "search";
}

interface DataLineageState {
	currentGraph: DataLineageGraph | null;
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
	loadGraphsFromBackend: () => Promise<void>;
	loadGraph: (graphId: string) => Promise<void>;
	loadFromFile: (file: File) => Promise<void>;
	loadFromAPI: (url: string) => Promise<void>;
	saveGraph: (graph: DataLineageGraph) => Promise<void>;
	createGraph: (graph: DataLineageGraph) => Promise<void>;
	deleteGraph: (graphId: string) => Promise<void>;
	setCurrentGraph: (graph: DataLineageGraph) => void;
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
	setRevealPosition: (pos: Partial<RevealPosition>) => void;
	isNeedReveal: (scene: "editor" | "graph") => boolean;
	setEnableSyncScroll: (enable: boolean) => void;
	markAsChanged: () => void;
	discardChanges: () => void;
	commitChanges: () => void;
}

type DataLineageStore = DataLineageState & DataLineageActions;

const initialState: DataLineageState = {
	currentGraph: null,
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

	loadGraphsFromBackend: async () => {
		set({ isLoading: true, error: null });
		try {
			const backendItems = await jsonDataService.getAll();
			const graphs = backendItems.map((item) => item.data as DataLineageGraph);

			const currentGraph = graphs.length > 0 ? graphs[0] : null;

			set({
				graphs,
				currentGraph,
				originalGraph: currentGraph,
				hasUnsavedChanges: false,
				isLoading: false,
			});
		} catch (error) {
			console.error("Ошибка загрузки данных с бэкенда:", error);
			set({
				error: `Ошибка загрузки данных: ${error}`,
				isLoading: false,
				graphs: [],
				currentGraph: null,
				originalGraph: null,
			});
		}
	},

	loadGraph: async (graphId: string) => {
		set({ isLoading: true, error: null });
		try {
			const backendItem = await jsonDataService.getById(graphId);
			const graph = backendItem.data as DataLineageGraph;

			set({
				currentGraph: graph,
				originalGraph: graph,
				hasUnsavedChanges: false,
				isLoading: false,
			});
		} catch (error) {
			set({
				error: `Ошибка загрузки графика с ID ${graphId}: ${error}`,
				isLoading: false,
			});
		}
	},

	loadFromFile: async (file: File) => {
		set({ isLoading: true, error: null });
		try {
			const text = await file.text();
			const data = JSON.parse(text);

			if (data.desc && data.entities && data.mappings) {
				const graph = data as DataLineageGraph;
				set({
					currentGraph: graph,
					originalGraph: graph,
					hasUnsavedChanges: false,
					isLoading: false,
				});
			} else {
				throw new Error("Неподдерживаемый формат файла");
			}
		} catch (error) {
			set({ error: `Ошибка загрузки файла: ${error}`, isLoading: false });
		}
	},

	loadFromAPI: async (url: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();

			if (data.desc && data.entities && data.mappings) {
				const graph = data as DataLineageGraph;
				set({
					currentGraph: graph,
					originalGraph: graph,
					hasUnsavedChanges: false,
					isLoading: false,
				});
			} else {
				throw new Error("API вернул данные в неподдерживаемом формате");
			}
		} catch (error) {
			set({ error: `Ошибка загрузки с API: ${error}`, isLoading: false });
		}
	},

	saveGraph: async (graph: DataLineageGraph) => {
		set({ isLoading: true, error: null });
		try {
			await jsonDataService.create({ data: graph });
			await get().loadGraphsFromBackend();
			set({
				originalGraph: graph,
				hasUnsavedChanges: false,
				isLoading: false,
			});
		} catch (error) {
			set({ error: `Ошибка сохранения графика: ${error}`, isLoading: false });
		}
	},

	createGraph: async (graph: DataLineageGraph) => {
		set({ isLoading: true, error: null });
		try {
			await jsonDataService.create({ data: graph });
			await get().loadGraphsFromBackend();
			set({
				currentGraph: graph,
				originalGraph: graph,
				hasUnsavedChanges: false,
				isLoading: false,
			});
		} catch (error) {
			set({ error: `Ошибка создания графика: ${error}`, isLoading: false });
		}
	},

	deleteGraph: async (graphId: string) => {
		set({ isLoading: true, error: null });
		try {
			await jsonDataService.delete(graphId);
			await get().loadGraphsFromBackend();

			const { currentGraph } = get();
			if (currentGraph && (currentGraph as any).id === graphId) {
				const { graphs } = get();
				const newCurrentGraph = graphs.length > 0 ? graphs[0] : null;
				set({
					currentGraph: newCurrentGraph,
					originalGraph: newCurrentGraph,
					hasUnsavedChanges: false,
				});
			}

			set({ isLoading: false });
		} catch (error) {
			set({ error: `Ошибка удаления графика: ${error}`, isLoading: false });
		}
	},

	setCurrentGraph: (graph: DataLineageGraph) => {
		set({ currentGraph: graph });
		get().markAsChanged();
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

		// Note: This would need to be adapted based on actual DataLineageGraph structure
		// Since DataLineageGraph doesn't have nodes directly, this might need restructuring
		console.warn(
			"addNode: DataLineageGraph structure doesn't support direct node addition",
		);
		get().markAsChanged();
	},

	updateNode: (_nodeId: string, _updates: Partial<DataLineageNode>) => {
		const { currentGraph } = get();
		if (!currentGraph) return;

		// Note: This would need to be adapted based on actual DataLineageGraph structure
		console.warn(
			"updateNode: DataLineageGraph structure doesn't support direct node updates",
		);
		get().markAsChanged();
	},

	deleteNode: (nodeId: string) => {
		const { currentGraph } = get();
		if (!currentGraph) return;

		// Note: This would need to be adapted based on actual DataLineageGraph structure
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

		// Note: This would need to be adapted based on actual DataLineageGraph structure
		console.warn(
			"addEdge: DataLineageGraph structure doesn't support direct edge addition",
		);
		get().markAsChanged();
	},

	updateEdge: (_edgeId: string, _updates: Partial<DataLineageEdge>) => {
		const { currentGraph } = get();
		if (!currentGraph) return;

		// Note: This would need to be adapted based on actual DataLineageGraph structure
		console.warn(
			"updateEdge: DataLineageGraph structure doesn't support direct edge updates",
		);
		get().markAsChanged();
	},

	deleteEdge: (edgeId: string) => {
		const { currentGraph } = get();
		if (!currentGraph) return;

		// Note: This would need to be adapted based on actual DataLineageGraph structure
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

		// Note: Search would need to be adapted for DataLineageGraph structure
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
			// CSV export would need to be adapted for DataLineageGraph structure
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
					set({
						currentGraph: graph,
						originalGraph: graph,
						hasUnsavedChanges: false,
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
}));
