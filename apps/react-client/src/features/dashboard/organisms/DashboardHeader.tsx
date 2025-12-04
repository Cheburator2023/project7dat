import { memo, useState, useCallback, useMemo } from "react";
import {
	Divider,
	IconButton,
	Button,
	Select,
	MenuItem,
	type SelectChangeEvent,
} from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { CommitDialog } from "@react-client/features/commitHistory/CommitDialog";
import { EntityPreviewNavigationButton } from "@react-client/features/entityPreview/EntityPreviewNavigationButton";
import {
	useCurrentDataLineageGraph,
	useCommitList,
	DATA_LINEAGE_QUERY_KEYS,
} from "@react-client/api/hooks";
import { useJsonDataList } from "@react-client/api/hooks";
import type { JsonDataItem } from "@react-client/api/hooks/jsonDataApi";
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

// S2T format conversion utilities
interface S2TFormat {
	generatedAt: string;
	format: string;
	desc?: { appId?: string; appName?: string };
	entities?: Array<{
		id: string;
		name: string | null;
		type: string;
		namespace?: string;
		modified?: boolean;
		description?: string;
		attrSeq?: Array<{ name: string; type: string; comment?: string }>;
	}>;
	mappings?: Array<{
		id: number;
		entityId: string;
		deps?: Array<{
			entityId: string;
			attrMaps?: Array<{ src: string; dst: string }>;
			atrDeps?: Array<{ attr: string; linkTypes?: Array<string> }>;
		}>;
	}>;
}

const convertGraphToS2T = (graph: DataLineageGraph): S2TFormat => {
	return {
		generatedAt: new Date().toISOString(),
		format: "S2T-JSON",
		desc: graph.desc,
		entities: graph.entities?.map((entity) => ({
			id: entity.id,
			name: entity.name,
			type: entity.type,
			namespace: entity.namespace,
			modified: entity.modified,
			description: entity.description,
			attrSeq: entity.attrSeq,
		})),
		mappings: graph.mappings?.map((mapping) => ({
			id: mapping.id,
			entityId: mapping.entityId,
			deps: mapping.deps?.map((dep) => ({
				entityId: dep.entityId,
				attrMaps: dep.attrMaps,
				atrDeps: dep.atrDeps,
			})),
		})),
	};
};

const convertS2TToGraph = (s2t: S2TFormat): DataLineageGraph => {
	return {
		desc: {
			appId: s2t.desc?.appId ?? "imported",
			appName: s2t.desc?.appName ?? "Imported S2T",
		},
		entities:
			s2t.entities?.map((entity) => ({
				id: entity.id,
				name: entity.name,
				type:
					(entity.type as "table" | "view" | "rdd" | "unresolved") || "table",
				namespace: entity.namespace,
				modified: entity.modified ?? false,
				description: entity.description,
				attrSeq: entity.attrSeq,
			})) ?? [],
		mappings:
			s2t.mappings?.map((mapping, index) => ({
				id: mapping.id ?? index,
				entityId: mapping.entityId,
				deps: mapping.deps?.map((dep) => ({
					entityId: dep.entityId,
					attrMaps: dep.attrMaps,
					atrDeps: dep.atrDeps?.map((atrDep) => ({
						attr: atrDep.attr,
						linkTypes: atrDep.linkTypes as Array<
							"window" | "join" | "where" | "groupby"
						>,
					})),
				})),
			})) ?? [],
		failedMappings: [],
	};
};

export const DashboardHeader = memo(() => {
	// Data lineage store for commit functionality
	const {
		currentGraphId,
		currentGraph,
		hasUnsavedChanges,
		discardChanges,
		setCurrentGraph,
		markAsChanged,
	} = useDataLineageStore(
		useShallow((state) => ({
			currentGraphId: state.currentGraphId,
			currentGraph: state.currentGraph,
			hasUnsavedChanges: state.hasUnsavedChanges,
			discardChanges: state.discardChanges,
			setCurrentGraph: state.setCurrentGraph,
			markAsChanged: state.markAsChanged,
		})),
	);

	// Commit dialog state
	const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);

	// Query client and mutations
	const queryClient = useQueryClient();
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

	// Import handler with format support
	const handleImport = useCallback(
		(format: "json" | "s2t") => {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = ".json";
			input.onchange = (event) => {
				const file = (event.target as HTMLInputElement).files?.[0];
				if (file) {
					const reader = new FileReader();
					reader.onload = (e) => {
						try {
							const content = e.target?.result as string;
							const parsedData = JSON.parse(content);

							let graphData: DataLineageGraph;
							if (format === "s2t") {
								// Convert S2T format to DataLineageGraph
								graphData = convertS2TToGraph(parsedData);
							} else {
								graphData = parsedData as DataLineageGraph;
							}

							setCurrentGraph(graphData);
							markAsChanged();
						} catch (error) {
							console.error("Ошибка при парсинге JSON:", error);
							alert("Ошибка при загрузке файла. Проверьте формат JSON.");
						}
					};
					reader.readAsText(file);
				}
			};
			input.click();
		},
		[setCurrentGraph, markAsChanged],
	);

	// Export handler with format support
	const handleExport = useCallback(
		(format: "json" | "s2t") => {
			if (!currentGraph) {
				alert("Нет данных для экспорта");
				return;
			}

			let exportData: unknown;
			let filename: string;

			if (format === "s2t") {
				exportData = convertGraphToS2T(currentGraph);
				filename = `dl_s2t_export_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
			} else {
				exportData = currentGraph;
				filename = `dl_json_export_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
			}

			const dataStr = JSON.stringify(exportData, null, 2);
			const dataBlob = new Blob([dataStr], { type: "application/json" });
			const url = URL.createObjectURL(dataBlob);

			const link = document.createElement("a");
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		},
		[currentGraph],
	);

	// Import/Export format selection handlers
	const handleImportFormatChange = useCallback(
		(event: SelectChangeEvent<string>) => {
			const format = event.target.value as "json" | "s2t";
			handleImport(format);
		},
		[handleImport],
	);

	const handleExportFormatChange = useCallback(
		(event: SelectChangeEvent<string>) => {
			const format = event.target.value as "json" | "s2t";
			handleExport(format);
		},
		[handleExport],
	);

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

					{/* Entity preview navigation */}
					{/* <EntityPreviewNavigationButton /> */}

					{/* Import format selector */}
					<Select
						value=""
						onChange={handleImportFormatChange}
						displayEmpty
						size="small"
						title="Импорт из файла"
						renderValue={() => "Импорт"}
						sx={{
							minWidth: 40,
							"& svg": {
								display: "none",
							},
						}}
					>
						<MenuItem value="json">JSON</MenuItem>
						<MenuItem value="s2t">S2T</MenuItem>
					</Select>

					{/* Export format selector */}
					<Select
						value=""
						onChange={handleExportFormatChange}
						displayEmpty
						size="small"
						title="Экспорт в файл"
						renderValue={() => "Экспорт"}
						sx={{
							minWidth: 40,
							"& svg": {
								display: "none",
							},
						}}
					>
						<MenuItem value="json">JSON</MenuItem>
						<MenuItem value="s2t">S2T</MenuItem>
					</Select>

					{/* Refresh button */}
					<IconButton
						onClick={handleManualLoad}
						title="Загрузить текущее состояние"
					>
						<RefreshIcon />
					</IconButton>
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
