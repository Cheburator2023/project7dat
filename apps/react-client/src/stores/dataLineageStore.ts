import exampleDataLineage from "@react-client/data/exampleDataLineage.json";
import { sampleDataLineageGraphs } from "@react-client/data/sampleDataLineageGraphs";
import type {
	DataLineageEdge,
	DataLineageFilter,
	DataLineageGraph,
	DataLineageNode,
	DataLineageSearchResult,
} from "@react-client/types/dataLineage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DataLineageState {
	currentGraph: DataLineageGraph | null;
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
}

interface DataLineageActions {
	loadGraph: (graphId: string) => Promise<void>;
	saveGraph: (graph: DataLineageGraph) => Promise<void>;
	createGraph: (
		graph: Omit<DataLineageGraph, "id" | "created" | "updated">,
	) => Promise<void>;
	deleteGraph: (graphId: string) => Promise<void>;
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
}

type DataLineageStore = DataLineageState & DataLineageActions;

const allSampleGraphs = [
	exampleDataLineage as DataLineageGraph,
	...sampleDataLineageGraphs,
];

const initialState: DataLineageState = {
	currentGraph: allSampleGraphs[0],
	graphs: allSampleGraphs,
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
						set({ currentGraph: graph, isLoading: false });
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

			saveGraph: async (graph: DataLineageGraph) => {
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
							isLoading: false,
						});
					} else {
						set({
							graphs: [...graphs, updatedGraph],
							currentGraph: updatedGraph,
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
					const newGraph: DataLineageGraph = {
						...graphData,
						id: generateId(),
						created: timestamp,
						updated: timestamp,
					};

					const { graphs } = get();
					set({
						graphs: [...graphs, newGraph],
						currentGraph: newGraph,
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
			},

			selectNode: (nodeId: string, multiSelect = false) => {
				const { selectedNodes } = get();

				if (multiSelect) {
					const isSelected = selectedNodes.includes(nodeId);
					const newSelection = isSelected
						? selectedNodes.filter((id) => id !== nodeId)
						: [...selectedNodes, nodeId];
					set({ selectedNodes: newSelection });
				} else {
					set({ selectedNodes: [nodeId] });
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
						const graph = JSON.parse(data) as DataLineageGraph;
						const { graphs } = get();
						set({
							graphs: [...graphs, graph],
							currentGraph: graph,
							isLoading: false,
						});
					}
				} catch (error) {
					set({ error: `Failed to import graph: ${error}`, isLoading: false });
				}
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
