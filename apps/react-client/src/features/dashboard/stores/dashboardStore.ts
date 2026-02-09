import { create } from "zustand";
import type { FilterState, HighlightedAttribute } from "../types";
import { initialFilters } from "../types";

// ============================================================================
// Dashboard Selection Store
// ============================================================================

interface SelectionState {
	// Selected entity/model/object IDs
	selectedEntityId: string | null;
	selectedGraphId: string | null;
	selectedAttributeName: string | null;

	// Hovered attribute for cross-node highlighting
	hoveredAttribute: HighlightedAttribute | null;
	setHoveredAttribute: (attr: HighlightedAttribute | null) => void;

	// Clicked/selected attributes for persistent cross-node highlighting (multi-select)
	selectedAttributes: HighlightedAttribute[];
	toggleSelectedAttribute: (attr: HighlightedAttribute) => void;
	clearSelectedAttributes: () => void;

	// Highlight sets for different panels
	highlightedEntities: Set<string>;
	highlightedRows: Set<string>;
	highlightedCodeLines: Set<number>;

	// Fuzzy search matched entities (for graph highlighting)
	searchMatchedEntities: Map<string, number>; // entityId -> score
	setSearchMatchedEntities: (matches: Map<string, number>) => void;

	// Filter state
	globalSearchQuery: string;
	globalAttributeSearchQuery: string;
	localNodeAttributeSearchQueries: Record<string, string>;
	filters: FilterState;

	// Actions
	selectEntity: (entityId: string | null, graphId?: string | null) => void;
	selectEntityWithAttribute: (
		entityId: string,
		attrName: string,
		graphId?: string | null,
	) => void;
	selectAttribute: (attrName: string | null) => void;
	highlightEntity: (entityId: string) => void;
	clearHighlights: () => void;
	setGlobalSearch: (query: string) => void;
	setGlobalAttributeSearch: (query: string) => void;
	setLocalNodeAttributeSearch: (entityId: string, query: string) => void;
	setFilters: (filters: FilterState) => void;
	updateFilter: <K extends keyof FilterState>(
		key: K,
		value: FilterState[K],
	) => void;
	resetFilters: () => void;

	// Computed upstream/downstream
	upstreamEntities: Set<string>;
	downstreamEntities: Set<string>;
	setUpstreamDownstream: (
		upstream: Set<string>,
		downstream: Set<string>,
	) => void;

	// Zoom to node in graph
	zoomToNodeId: string | null;
	setZoomToNode: (nodeId: string | null) => void;

	// Highlight specific attribute mapping (for navigation with highlighting)
	highlightedMapping: {
		sourceEntityId: string;
		targetEntityId: string;
		sourceAttr?: string;
		targetAttr?: string;
	} | null;
	setHighlightedMapping: (
		mapping: {
			sourceEntityId: string;
			targetEntityId: string;
			sourceAttr?: string;
			targetAttr?: string;
		} | null,
	) => void;
}

export const useDashboardStore = create<SelectionState>((set) => ({
	selectedEntityId: null,
	selectedGraphId: null,
	selectedAttributeName: null,
	hoveredAttribute: null,
	setHoveredAttribute: (attr) => set({ hoveredAttribute: attr }),
	selectedAttributes: [],
	toggleSelectedAttribute: (attr) =>
		set((state) => {
			const exists = state.selectedAttributes.some(
				(a) => a.entityId === attr.entityId && a.attrName === attr.attrName,
			);
			if (exists) {
				return {
					selectedAttributes: state.selectedAttributes.filter(
						(a) =>
							!(a.entityId === attr.entityId && a.attrName === attr.attrName),
					),
				};
			}
			return {
				selectedAttributes: [...state.selectedAttributes, attr],
			};
		}),
	clearSelectedAttributes: () => set({ selectedAttributes: [] }),
	highlightedEntities: new Set(),
	highlightedRows: new Set(),
	highlightedCodeLines: new Set(),
	searchMatchedEntities: new Map(),
	setSearchMatchedEntities: (matches) =>
		set({ searchMatchedEntities: matches }),
	globalSearchQuery: "",
	globalAttributeSearchQuery: "",
	localNodeAttributeSearchQueries: {},
	upstreamEntities: new Set(),
	downstreamEntities: new Set(),

	selectEntity: (entityId, graphId = null) =>
		set((state) => ({
			selectedEntityId: entityId,
			selectedGraphId: graphId ?? state.selectedGraphId,
			selectedAttributeName: null,
			highlightedEntities: entityId ? new Set([entityId]) : new Set(),
		})),

	selectEntityWithAttribute: (entityId, attrName, graphId = null) =>
		set((state) => ({
			selectedEntityId: entityId,
			selectedGraphId: graphId ?? state.selectedGraphId,
			selectedAttributeName: attrName,
			selectedAttributes: [{ entityId, attrName }],
			highlightedEntities: entityId ? new Set([entityId]) : new Set(),
		})),

	selectAttribute: (attrName) => set({ selectedAttributeName: attrName }),

	highlightEntity: (entityId) =>
		set((state) => ({
			highlightedEntities: new Set([...state.highlightedEntities, entityId]),
		})),

	clearHighlights: () =>
		set({
			selectedEntityId: null,
			selectedAttributeName: null,
			highlightedEntities: new Set(),
			highlightedRows: new Set(),
			highlightedCodeLines: new Set(),
			upstreamEntities: new Set(),
			downstreamEntities: new Set(),
		}),

	setGlobalSearch: (query) => set({ globalSearchQuery: query }),
	setGlobalAttributeSearch: (query) =>
		set({ globalAttributeSearchQuery: query }),
	setLocalNodeAttributeSearch: (entityId, query) =>
		set((state) => {
			const trimmed = query.trim();
			const next = { ...state.localNodeAttributeSearchQueries };
			if (!trimmed) {
				delete next[entityId];
			} else {
				next[entityId] = query;
			}
			return { localNodeAttributeSearchQueries: next };
		}),

	filters: initialFilters,
	setFilters: (filters) => set({ filters }),
	updateFilter: (key, value) =>
		set((state) => ({
			filters: { ...state.filters, [key]: value },
		})),
	resetFilters: () => set({ filters: initialFilters }),

	setUpstreamDownstream: (upstream, downstream) =>
		set({ upstreamEntities: upstream, downstreamEntities: downstream }),

	zoomToNodeId: null,
	setZoomToNode: (nodeId) => set({ zoomToNodeId: nodeId }),

	highlightedMapping: null,
	setHighlightedMapping: (mapping) => set({ highlightedMapping: mapping }),
}));
