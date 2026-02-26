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
import { useCurrentSchema } from "../hooks/useCurrentSchema";

export const CodeEditorPanel = memo(() => {
	const { selectedEntityId } = useEntitiesStore();
	const { currentSchema } = useCurrentSchema();

	// Get dataLineageStore actions
	const {
		setCurrentGraph,
		setRevealPosition,
		initializeGraph,
		currentGraphId,
	} = useDataLineageStore(
		useShallow((state) => ({
			setCurrentGraph: state.setCurrentGraph,
			setRevealPosition: state.setRevealPosition,
			initializeGraph: state.initializeGraph,
			currentGraphId: state.currentGraphId,
		})),
	);

	const { addHighlight, clearHighlights, setExpanded } = useJsonEditorStore();

	// Initialize dataLineageStore with server data on first load
	useEffect(() => {
		if (currentSchema && !currentGraphId) {
			initializeGraph(currentSchema as DataLineageGraph);
		}
	}, [currentSchema, currentGraphId, initializeGraph]);

	// Handle changes from CodeJsonEditor - update dataLineageStore
	const handleEditorChange = useCallback(
		(newData: DataLineageGraph) => {
			setCurrentGraph(newData);
		},
		[setCurrentGraph],
	);

	// When entity is selected, trigger scroll and highlight in CodeJsonEditor
	useEffect(() => {
		if (selectedEntityId && currentSchema) {
			// Find entity index in schema
			const entityIndex = currentSchema.entities?.findIndex(
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
		currentSchema,
		setRevealPosition,
		addHighlight,
		clearHighlights,
		setExpanded,
	]);

	if (!currentSchema) {
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
				initialData={currentSchema}
				onChange={handleEditorChange}
			/>
		</Box>
	);
});

CodeEditorPanel.displayName = "CodeEditorPanel";
