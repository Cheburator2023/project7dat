import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useJsonDataList } from "@react-client/api/hooks";
import type { JsonDataItem } from "@react-client/api/hooks/jsonDataApi";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import type { DataLineageSchema } from "@react-client/types/dataLineage";

import { useDashboardStore } from "../stores";

/**
 * Hook that returns the current schema data.
 * If there are unsaved changes in dataLineageStore, it returns the edited data.
 * Otherwise, it returns the data from the server (useJsonDataList).
 *
 * This ensures that all panels (Graph, Entities, Objects, etc.) stay in sync
 * with the JSON editor when changes are made.
 */
export function useCurrentSchema() {
	const selectedGraphId = useDashboardStore((state) => state.selectedGraphId);
	const { data: jsonDataList, isLoading, error } = useJsonDataList();

	// Get edited data from dataLineageStore
	const { currentGraph, currentGraphId, hasUnsavedChanges } =
		useDataLineageStore(
			useShallow((state) => ({
				currentGraph: state.currentGraph,
				currentGraphId: state.currentGraphId,
				hasUnsavedChanges: state.hasUnsavedChanges,
			})),
		);

	// Determine effective graph ID
	const effectiveGraphId = useMemo(() => {
		if (selectedGraphId) return selectedGraphId;
		if (currentGraphId) return currentGraphId;
		// if (jsonDataList && jsonDataList.length > 0) return jsonDataList[0].id;
		return null;
	}, [selectedGraphId, currentGraphId, jsonDataList]);

	// Get the schema - prefer edited version from dataLineageStore if available
	const currentSchema: DataLineageSchema | null = useMemo(() => {
		// If currentGraph is set and matches the effective graph ID, use it
		// This ensures we always show the latest edited data
		if (currentGraph) {
			return currentGraph as DataLineageSchema;
		}

		// If currentGraph is set but no specific graph is selected, use it
		// This handles the case when editor initializes the graph
		if (currentGraph && !selectedGraphId && currentGraphId) {
			return currentGraph as DataLineageSchema;
		}

		// Otherwise, get from server data
		if (!jsonDataList || !effectiveGraphId) return null;
		const item = jsonDataList.find(
			(i: JsonDataItem) => i.id === effectiveGraphId,
		);
		return item?.data ?? null;
	}, [
		jsonDataList,
		effectiveGraphId,
		currentGraph,
		currentGraphId,
		selectedGraphId,
	]);

	return {
		currentSchema,
		effectiveGraphId,
		isLoading,
		error,
		hasUnsavedChanges,
		jsonDataList,
	};
}
