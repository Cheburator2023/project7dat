import { sampleDataLineageActual } from "@react-client/data/sampleDataLineageActual";
import type {
	DataLineageEdge,
	DataLineageFilter,
	DataLineageGraph,
	DataLineageNode,
	DataLineageSearchResult,
	LegacyDataLineageGraph,
} from "@react-client/types/dataLineage";
import { convertToLegacyFormat } from "@react-client/utils/schemaConverter";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RevealPosition {
	version: number;
	nodeId: string;
	from: "editor" | "graph" | "search";
}

interface DataLineageState {
	currentGraph: LegacyDataLineageGraph | null;
	originalGraph: LegacyDataLineageGraph | null;
	currentActualData: DataLineageGraph | null;
	hasUnsavedChanges: boolean;
	graphs: LegacyDataLineageGraph[];
	actualDataSources: DataLineageGraph[];
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
	loadGraph: (graphId: string) => Promise<void>;
	loadActualData: (data: DataLineageGraph) => void;
	loadFromFile: (file: File) => Promise<void>;
	loadFromAPI: (url: string) => Promise<void>;
	saveGraph: (graph: LegacyDataLineageGraph) => Promise<void>;
	createGraph: (
		graph: Omit<LegacyDataLineageGraph, "id" | "created" | "updated">,
	) => Promise<void>;
	deleteGraph: (graphId: string) => Promise<void>;
	setCurrentGraph: (graph: LegacyDataLineageGraph) => void;
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

const allActualDataSources = [sampleDataLineageActual];

const initialLegacyGraph = convertToLegacyFormat(sampleDataLineageActual);

const initialState: DataLineageState = {
	currentGraph: initialLegacyGraph,
	originalGraph: initialLegacyGraph,
	currentActualData: sampleDataLineageActual,
	hasUnsavedChanges: false,
	graphs: [initialLegacyGraph],
	actualDataSources: allActualDataSources,
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

export const useDataLineageStore = create<DataLineageStore>()(
	persist(
		(set, get) => ({
			...initialState,

			loadGraph: async (graphId: string) => {
				set({ isLoading: true, error: null });
				try {
					const { graphs } = get();
					const graph = graphs.find((g) => g.id === graphId);
					if (graph) {
						set({
							currentGraph: graph,
							originalGraph: graph,
							hasUnsavedChanges: false,
							isLoading: false,
						});
					} else {
						set({
							error: `Graph with id ${graphId} not found`,
							isLoading: false,
						});
					}
				} catch (error) {
					set({ error: `Failed to load graph: ${error}`, isLoading: false });
				}
			},

			loadActualData: (data: DataLineageGraph) => {
				const legacyGraph = convertToLegacyFormat(data);
				set({
					currentActualData: data,
					currentGraph: legacyGraph,
					originalGraph: legacyGraph,
					hasUnsavedChanges: false,
				});
			},

			loadFromFile: async (file: File) => {
				set({ isLoading: true, error: null });
				try {
					const text = await file.text();
					const data = JSON.parse(text);

					if (data.desc && data.entities && data.mappings) {
						const actualData = data as DataLineageGraph;
						get().loadActualData(actualData);
					} else if (data.id && data.nodes && data.edges) {
						const legacyData = data as LegacyDataLineageGraph;
						set({
							currentGraph: legacyData,
							originalGraph: legacyData,
							currentActualData: null,
							hasUnsavedChanges: false,
						});
					} else {
						throw new Error("Неподдерживаемый формат файла");
					}

					set({ isLoading: false });
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
						const actualData = data as DataLineageGraph;
						get().loadActualData(actualData);
					} else {
						throw new Error("API вернул данные в неподдерживаемом формате");
					}

					set({ isLoading: false });
				} catch (error) {
					set({ error: `Ошибка загрузки с API: ${error}`, isLoading: false });
				}
			},

			saveGraph: async (graph: LegacyDataLineageGraph) => {
				set({ isLoading: true, error: null });
				try {
					const { graphs } = get();
					const updatedGraph = { ...graph, updated: generateTimestamp() };
					const existingIndex = graphs.findIndex((g) => g.id === graph.id);

					if (existingIndex >= 0) {
						const updatedGraphs = [...graphs];
						updatedGraphs[existingIndex] = updatedGraph;
						set({
							graphs: updatedGraphs,
							currentGraph: updatedGraph,
							originalGraph: updatedGraph,
							hasUnsavedChanges: false,
							isLoading: false,
						});
					} else {
						set({
							graphs: [...graphs, updatedGraph],
							currentGraph: updatedGraph,
							originalGraph: updatedGraph,
							hasUnsavedChanges: false,
							isLoading: false,
						});
					}
				} catch (error) {
					set({ error: `Failed to save graph: ${error}`, isLoading: false });
				}
			},

			createGraph: async (graphData) => {
				set({ isLoading: true, error: null });
				try {
					const timestamp = generateTimestamp();
					const newGraph: LegacyDataLineageGraph = {
						...graphData,
						id: generateId(),
						created: timestamp,
						updated: timestamp,
					};

					const { graphs } = get();
					set({
						graphs: [...graphs, newGraph],
						currentGraph: newGraph,
						originalGraph: newGraph,
						hasUnsavedChanges: false,
						isLoading: false,
					});
				} catch (error) {
					set({ error: `Failed to create graph: ${error}`, isLoading: false });
				}
			},

			deleteGraph: async (graphId: string) => {
				set({ isLoading: true, error: null });
				try {
					const { graphs, currentGraph } = get();
					const updatedGraphs = graphs.filter((g) => g.id !== graphId);
					const newCurrentGraph =
						currentGraph?.id === graphId ? null : currentGraph;

					set({
						graphs: updatedGraphs,
						currentGraph: newCurrentGraph,
						isLoading: false,
					});
				} catch (error) {
					set({ error: `Failed to delete graph: ${error}`, isLoading: false });
				}
			},

			setCurrentGraph: (graph: LegacyDataLineageGraph) => {
				set({ currentGraph: graph });
				get().markAsChanged();
			},

			addNode: (nodeData) => {
				const { currentGraph } = get();
				if (!currentGraph) return;

				const newNode: DataLineageNode = {
					...nodeData,
					id: generateId(),
					metadata: {
						...nodeData.metadata,
						created: generateTimestamp(),
						updated: generateTimestamp(),
					},
				};

				const updatedGraph = {
					...currentGraph,
					nodes: [...currentGraph.nodes, newNode],
					updated: generateTimestamp(),
				};

				set({ currentGraph: updatedGraph });
				get().markAsChanged();
			},

			updateNode: (nodeId: string, updates: Partial<DataLineageNode>) => {
				const { currentGraph } = get();
				if (!currentGraph) return;

				const updatedNodes = currentGraph.nodes.map((node) =>
					node.id === nodeId
						? {
								...node,
								...updates,
								metadata: {
									...node.metadata,
									...updates.metadata,
									updated: generateTimestamp(),
								},
							}
						: node,
				);

				const updatedGraph = {
					...currentGraph,
					nodes: updatedNodes,
					updated: generateTimestamp(),
				};

				set({ currentGraph: updatedGraph });
				get().markAsChanged();
			},

			deleteNode: (nodeId: string) => {
				const { currentGraph } = get();
				if (!currentGraph) return;

				const updatedNodes = currentGraph.nodes.filter(
					(node) => node.id !== nodeId,
				);
				const updatedEdges = currentGraph.edges.filter(
					(edge) => edge.sourceId !== nodeId && edge.targetId !== nodeId,
				);

				const updatedGraph = {
					...currentGraph,
					nodes: updatedNodes,
					edges: updatedEdges,
					updated: generateTimestamp(),
				};

				set({
					currentGraph: updatedGraph,
					selectedNodes: get().selectedNodes.filter((id) => id !== nodeId),
				});
				get().markAsChanged();
			},

			addEdge: (edgeData) => {
				const { currentGraph } = get();
				if (!currentGraph) return;

				const newEdge: DataLineageEdge = {
					...edgeData,
					id: generateId(),
					metadata: {
						...edgeData.metadata,
						created: generateTimestamp(),
					},
				};

				const updatedGraph = {
					...currentGraph,
					edges: [...currentGraph.edges, newEdge],
					updated: generateTimestamp(),
				};

				set({ currentGraph: updatedGraph });
				get().markAsChanged();
			},

			updateEdge: (edgeId: string, updates: Partial<DataLineageEdge>) => {
				const { currentGraph } = get();
				if (!currentGraph) return;

				const updatedEdges = currentGraph.edges.map((edge) =>
					edge.id === edgeId ? { ...edge, ...updates } : edge,
				);

				const updatedGraph = {
					...currentGraph,
					edges: updatedEdges,
					updated: generateTimestamp(),
				};

				set({ currentGraph: updatedGraph });
				get().markAsChanged();
			},

			deleteEdge: (edgeId: string) => {
				const { currentGraph } = get();
				if (!currentGraph) return;

				const updatedEdges = currentGraph.edges.filter(
					(edge) => edge.id !== edgeId,
				);

				const updatedGraph = {
					...currentGraph,
					edges: updatedEdges,
					updated: generateTimestamp(),
				};

				set({
					currentGraph: updatedGraph,
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

				const lowerQuery = query.toLowerCase();
				const matchingNodes = currentGraph.nodes.filter(
					(node) =>
						node.name.toLowerCase().includes(lowerQuery) ||
						node.description?.toLowerCase().includes(lowerQuery) ||
						node.metadata.tags.some((tag) =>
							tag.toLowerCase().includes(lowerQuery),
						),
				);

				const matchingEdges = currentGraph.edges.filter((edge) =>
					edge.metadata.transformationLogic?.toLowerCase().includes(lowerQuery),
				);

				const searchResults: DataLineageSearchResult = {
					nodes: matchingNodes,
					edges: matchingEdges,
					totalCount: matchingNodes.length + matchingEdges.length,
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
					const headers = ["id", "name", "type", "status", "owner", "created"];
					const rows = currentGraph.nodes.map((node) => [
						node.id,
						node.name,
						node.type,
						node.status,
						node.metadata.owner || "",
						node.metadata.created,
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
							const actualData = parsedData as DataLineageGraph;
							get().loadActualData(actualData);
						} else if (parsedData.id && parsedData.nodes && parsedData.edges) {
							const legacyGraph = parsedData as LegacyDataLineageGraph;
							const { graphs } = get();
							set({
								graphs: [...graphs, legacyGraph],
								currentGraph: legacyGraph,
								originalGraph: legacyGraph,
								currentActualData: null,
								hasUnsavedChanges: false,
								isLoading: false,
							});
						} else {
							throw new Error("Неподдерживаемый формат данных");
						}
					}
				} catch (error) {
					set({ error: `Failed to import graph: ${error}`, isLoading: false });
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
		}),
		{
			name: "data-lineage-store",
			partialize: (state) => ({
				graphs: state.graphs,
				currentGraph: state.currentGraph,
				viewMode: state.viewMode,
				filter: state.filter,
			}),
		},
	),
);
