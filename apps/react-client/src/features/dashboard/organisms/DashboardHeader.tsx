import { memo, useState, useCallback, useMemo } from "react";
import { Button, IconButton, type SelectChangeEvent } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
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
import { S2tImportDialog } from "@react-client/features/s2tImport/S2tImportDialog";
import { RefreshCwIcon } from "lucide-react";

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

	const [isS2tImportDialogOpen, setIsS2tImportDialogOpen] = useState(false);

	const { refetch: refetchCurrentGraph } = useCurrentDataLineageGraph({
		enabled: false,
	});
	const { refetch: refetchCommitList } = useCommitList({
		graphId: undefined,
	});

	// Import handler with format support
	const handleImport = useCallback(
		(format: "json" | "s2t") => {
			if (format === "s2t") {
				setIsS2tImportDialogOpen(true);
				return;
			}

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

							const graphData = parsedData as DataLineageGraph;

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
	const _handleImportFormatChange = useCallback(
		(event: SelectChangeEvent<string>) => {
			const format = event.target.value as "json" | "s2t";
			handleImport(format);
		},
		[handleImport],
	);

	const _handleExportFormatChange = useCallback(
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
					<FilterButton />

					{/* <Select
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
					</Select> */}

					{/* Export format selector */}
					{/* <Select
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
					</Select> */}

					{/* Refresh button */}
					<IconButton
						onClick={handleManualLoad}
						title="Загрузить текущее состояние"
					>
						<RefreshCwIcon />
					</IconButton>
				</Flex>
			</Header>

			<S2tImportDialog
				open={isS2tImportDialogOpen}
				onClose={() => setIsS2tImportDialogOpen(false)}
				onImported={handleManualLoad}
			/>
		</>
	);
});

DashboardHeader.displayName = "DashboardHeader";
