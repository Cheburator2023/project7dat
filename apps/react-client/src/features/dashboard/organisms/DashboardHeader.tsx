import { memo, useState, useCallback, useMemo } from "react";
import { Divider, Tooltip, IconButton, Button } from "@mui/material";
import {
	Download as DownloadIcon,
	FileUpload as FileUploadIcon,
	Refresh as RefreshIcon,
	Add as AddIcon,
} from "@mui/icons-material";
import { useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useEditorStore } from "@react-client/stores/editorStore";
import { CommitDialog } from "@react-client/features/commitHistory/CommitDialog";
import { EntityPreviewNavigationButton } from "@react-client/features/entityPreview/EntityPreviewNavigationButton";
import {
	useCurrentDataLineageGraph,
	useCommitList,
	useInitializeJsonGraph,
	DATA_LINEAGE_QUERY_KEYS,
} from "@react-client/api/hooks";
import { useJsonDataList } from "@react-client/api/hooks";
import type { JsonDataItem } from "@react-client/api/hooks/jsonDataApi";
import { dataLineageExampleData } from "@react-client/examples/dataLineageExampleData";
import type {
	DataLineageGraph,
	DataLineageSchema,
} from "@react-client/types/dataLineage";
import {
	GlobalSearchField,
	FilterButton,
	SelectedEntityChip,
} from "../molecules";
import {
	buildLineageGraph,
	getUpstreamNodes,
	getDownstreamNodes,
} from "../utils";
import type { EntityRow } from "../types";

export const DashboardHeader = memo(() => {
	// Data lineage store for commit functionality
	const {
		currentGraphId,
		currentGraph,
		hasUnsavedChanges,
		discardChanges,
		initializeGraph,
		setCurrentGraphId,
	} = useDataLineageStore(
		useShallow((state) => ({
			currentGraphId: state.currentGraphId,
			currentGraph: state.currentGraph,
			hasUnsavedChanges: state.hasUnsavedChanges,
			discardChanges: state.discardChanges,
			initializeGraph: state.initializeGraph,
			setCurrentGraphId: state.setCurrentGraphId,
		})),
	);

	// Editor store for import/export
	const { importFromFile, exportToFile } = useEditorStore();

	// Commit dialog state
	const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);

	// Query client and mutations
	const queryClient = useQueryClient();
	const initializeGraphMutation = useInitializeJsonGraph();
	const { refetch: refetchCurrentGraph } = useCurrentDataLineageGraph();
	const { refetch: refetchCommitList } = useCommitList({
		graphId: currentGraphId || undefined,
	});

	// Get all entities for filter options
	const { data: jsonDataList } = useJsonDataList();

	// Build entities list for filter options
	const allEntities: EntityRow[] = useMemo(() => {
		if (!jsonDataList) return [];
		const rows: EntityRow[] = [];

		jsonDataList.forEach((item: JsonDataItem) => {
			const schema = item.data as DataLineageSchema | undefined;
			if (!schema?.entities) return;

			// Build lineage graph for counts
			const lineageGraph = buildLineageGraph(schema.mappings || []);

			schema.entities.forEach((entity) => {
				const upstreamNodes = getUpstreamNodes(
					entity.id,
					lineageGraph.upstream,
				);
				upstreamNodes.delete(entity.id);
				const downstreamNodes = getDownstreamNodes(
					entity.id,
					lineageGraph.downstream,
				);
				downstreamNodes.delete(entity.id);

				rows.push({
					id: entity.id,
					graphId: item.id,
					name: entity.name ?? entity.id,
					type: entity.type,
					namespace: entity.namespace ?? "",
					attributeCount: entity.attrSeq?.length ?? 0,
					upstreamCount: upstreamNodes.size,
					downstreamCount: downstreamNodes.size,
					isDataMart: upstreamNodes.size > 0 && downstreamNodes.size === 0,
					isSource: upstreamNodes.size === 0 && downstreamNodes.size > 0,
					modified: entity.modified ?? false,
				});
			});
		});

		return rows;
	}, [jsonDataList]);

	// Calculate filter options from entities
	const filterOptions = useMemo(() => {
		const entityTypes = [...new Set(allEntities.map((e) => e.type))];
		const namespaces = [
			...new Set(allEntities.map((e) => e.namespace).filter(Boolean)),
		];
		return { entityTypes, namespaces };
	}, [allEntities]);

	// Commit handlers
	const handleCommitChanges = useCallback(() => {
		setIsCommitDialogOpen(true);
	}, []);

	const handleCommitDialogClose = useCallback(() => {
		setIsCommitDialogOpen(false);
		queryClient.invalidateQueries({
			queryKey: DATA_LINEAGE_QUERY_KEYS.current(),
		});
		if (currentGraphId) {
			refetchCommitList();
		}
	}, [queryClient, currentGraphId, refetchCommitList]);

	// Import/Export handlers
	const handleImport = useCallback(() => {
		if (!currentGraph) return;
		importFromFile();
	}, [currentGraph, importFromFile]);

	const handleExport = useCallback(() => {
		exportToFile();
	}, [exportToFile]);

	// Manual reload handler
	const handleManualLoad = useCallback(async () => {
		try {
			await refetchCurrentGraph();
			if (currentGraphId) {
				await refetchCommitList();
			}
		} catch (error) {
			console.error("Ошибка при загрузке данных:", error);
		}
	}, [refetchCurrentGraph, currentGraphId, refetchCommitList]);

	// Initialize new graph handler
	const handleInitializeGraph = useCallback(async () => {
		setIsInitializing(true);
		try {
			const result = await initializeGraphMutation.mutateAsync({
				data: dataLineageExampleData,
			});
			initializeGraph(result.data as DataLineageGraph);
			setCurrentGraphId(result.id);
			setTimeout(() => {
				setIsInitializing(false);
			}, 100);
		} catch (error) {
			console.error("Failed to initialize graph:", error);
			setIsInitializing(false);
		}
	}, [initializeGraphMutation, initializeGraph, setCurrentGraphId]);

	return (
		<>
			<Header>
				<SelectedEntityChip />
				<Flex gap={8} alignItems="center">
					<GlobalSearchField />
					<FilterButton filterOptions={filterOptions} />

					{/* Divider */}
					<Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

					{/* Commit buttons */}
					{hasUnsavedChanges && (
						<Flex gap={6}>
							<Button
								variant="outlined"
								color="error"
								onClick={discardChanges}
								size="small"
							>
								Отменить
							</Button>
							<Button
								variant="contained"
								color="primary"
								onClick={handleCommitChanges}
								size="small"
							>
								Создать коммит
							</Button>
						</Flex>
					)}

					{/* Initialize new JSON button */}
					<Button
						variant="outlined"
						size="small"
						startIcon={<AddIcon />}
						onClick={handleInitializeGraph}
						disabled={isInitializing}
						title="Инициализация графа"
					>
						{isInitializing ? "Инициализация..." : "Новый JSON"}
					</Button>

					{/* Entity preview navigation */}
					<EntityPreviewNavigationButton />

					{/* Import/Export buttons */}
					<Tooltip title="Импорт JSON из файла">
						<IconButton onClick={handleImport} disabled={!currentGraph}>
							<FileUploadIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title="Экспорт JSON в файл">
						<IconButton onClick={handleExport}>
							<DownloadIcon />
						</IconButton>
					</Tooltip>

					{/* Refresh button */}
					<Tooltip title="Загрузить текущее состояние">
						<IconButton onClick={handleManualLoad}>
							<RefreshIcon />
						</IconButton>
					</Tooltip>
				</Flex>
			</Header>

			{/* Commit Dialog */}
			<CommitDialog
				open={isCommitDialogOpen}
				onClose={handleCommitDialogClose}
			/>
		</>
	);
});

DashboardHeader.displayName = "DashboardHeader";
