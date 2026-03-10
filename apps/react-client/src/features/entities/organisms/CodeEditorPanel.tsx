import { memo, useEffect, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import type {
	DataLineageEntity,
	DataLineageGraph,
} from "@react-client/types/dataLineage";
import {
	CodeJsonEditor,
	useJsonEditorStore,
} from "@react-client/features/codeEditor/organisms/CodeJsonEditor";
import { useDataLineageStore } from "@react-client/common/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";

import { useEntitiesStore } from "../stores";

export const CodeEditorPanel = memo(() => {
	const { selectedEntityId } = useEntitiesStore();

	const {
		setCurrentGraph,
		setRevealPosition,
		initializeGraph,
		currentGraphId,
		currentGraph,
	} = useDataLineageStore(
		useShallow((state) => ({
			setCurrentGraph: state.setCurrentGraph,
			setRevealPosition: state.setRevealPosition,
			initializeGraph: state.initializeGraph,
			currentGraphId: state.currentGraphId,
			currentGraph: state.currentGraph,
		})),
	);

	const { addHighlight, clearHighlights, setExpanded } = useJsonEditorStore();

	// Initialize dataLineageStore with server data on first load
	useEffect(() => {
		if (currentGraph && !currentGraphId) {
			initializeGraph(currentGraph as DataLineageGraph);
		}
	}, [currentGraph, currentGraphId, initializeGraph]);

	// Handle changes from CodeJsonEditor - update dataLineageStore
	const handleEditorChange = useCallback(
		(newData: DataLineageGraph) => {
			setCurrentGraph(newData);
		},
		[setCurrentGraph],
	);

	// When entity is selected, trigger scroll and highlight in CodeJsonEditor
	useEffect(() => {
		if (selectedEntityId && currentGraph) {
			// Find entity index in schema
			const entityIndex = (currentGraph as any).entities?.findIndex(
				(e: DataLineageEntity) => e.id === selectedEntityId,
			);

			if (entityIndex !== undefined && entityIndex >= 0) {
				const entityPath = `entities.${entityIndex}`;

				// Clear previous highlights and add new one
				clearHighlights();
				addHighlight(entityPath);

				// Expand parent paths
				setExpanded("entities", true);
				setExpanded(entityPath, true);

				// Trigger scroll
				setRevealPosition({ nodeId: selectedEntityId, from: "graph" });
			}
		} else {
			clearHighlights();
		}
	}, [
		selectedEntityId,
		currentGraph,
		setRevealPosition,
		addHighlight,
		clearHighlights,
		setExpanded,
	]);

	if (!currentGraph) {
		return (
			<Box sx={{ p: 4, textAlign: "center" }}>
				<Typography color="text.secondary">
					Нет данных для отображения
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ height: "100%", width: "100%" }}>
			<CodeJsonEditor
				initialData={currentGraph as DataLineageGraph}
				onChange={handleEditorChange}
			/>
		</Box>
	);
});

CodeEditorPanel.displayName = "CodeEditorPanel";
