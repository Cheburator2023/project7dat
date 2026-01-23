import React, { useState, useMemo, useCallback } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import {
	useAllCommitsFromAllGraphs,
	useCommitList,
} from "@react-client/api/hooks";
import type { JsonCommitItem } from "@react-client/api/hooks/jsonDataApi";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { JsonViewerCell } from "@react-client/common/grid/JsonViewerCell";
import { JsonDiffViewerCell } from "@react-client/common/grid/JsonDiffViewerCell";
import { DataLineageGraph } from "@react-client/types/dataLineage";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";

export const AllCommitsPage: React.FC = () => {
	const { mode } = useColorScheme();
	const [_refreshKey, setRefreshKey] = useState(0);
	const [showAllGraphs, setShowAllGraphs] = useState(false);

	const singleGraphQuery = useCommitList({
		page: 1,
		limit: 100,
		enabled: !showAllGraphs,
	});

	const allGraphsQuery = useAllCommitsFromAllGraphs({
		page: 1,
		limit: 100,
		enabled: showAllGraphs,
	});

	const singleGraphCommitsResponse = singleGraphQuery.data;
	const allGraphsCommitsResponse = allGraphsQuery.data;

	const isLoadingSingle = singleGraphQuery.isLoading;
	const isLoadingAll = allGraphsQuery.isLoading;

	const errorSingle = singleGraphQuery.error;
	const errorAll = allGraphsQuery.error;
	const refetchSingle = singleGraphQuery.refetch;
	const refetchAll = allGraphsQuery.refetch;

	const commitsList = showAllGraphs
		? allGraphsCommitsResponse?.data || []
		: singleGraphCommitsResponse?.data || [];

	const isLoading = showAllGraphs ? isLoadingAll : isLoadingSingle;
	const error = showAllGraphs ? errorAll : errorSingle;

	const handleRefresh = () => {
		setRefreshKey((prev) => prev + 1);
		if (showAllGraphs) {
			refetchAll();
		} else {
			refetchSingle();
		}
	};

	const _handleToggleView = (event: React.ChangeEvent<HTMLInputElement>) => {
		setShowAllGraphs(event.target.checked);
	};

	const columnDefs: ColDef<JsonCommitItem>[] = useMemo(() => {
		const baseColumns: ColDef<JsonCommitItem>[] = [
			{
				headerName: "ID",
				field: "short_id",
				width: 100,
				pinned: "left",
				sortable: true,
				filter: true,
			},
			{
				headerName: "Сообщение",
				field: "message",
				width: 300,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2" noWrap>
							{params.value || "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "Автор",
				field: "author",
				width: 150,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					if (!params.value) return "—";
					return (
						params.value.username ||
						params.value.email ||
						params.value.id ||
						"—"
					);
				},
			},
			{
				headerName: "JSON ID",
				field: "graphId",
				width: 120,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2" noWrap fontFamily="monospace">
							{params.value ? params.value.substring(0, 8) : "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "Создан",
				field: "createdAt",
				width: 180,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					if (!params.value) return "—";
					return new Date(params.value).toLocaleString("ru-RU");
				},
			},
			{
				field: "diff",
				headerName: "Изменения",
				width: 300,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					return (
						<JsonDiffViewerCell
							diff={params.value}
							leftTitle="До изменений"
							rightTitle="После изменений"
						/>
					);
				},
			},
		];

		if (showAllGraphs) {
			baseColumns.push({
				field: "fullData" as keyof JsonCommitItem,
				headerName: "Полные данные",
				width: 300,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => <JsonViewerCell value={params.value} />,
			});
		}

		return baseColumns;
	}, [showAllGraphs]);

	const defaultColDef = useMemo(
		() => ({
			resizable: true,
			sortable: true,
			filter: true,
		}),
		[],
	);

	// Data lineage store for commit functionality
	const { setCurrentGraph, markAsChanged } = useDataLineageStore(
		useShallow((state) => ({
			setCurrentGraph: state.setCurrentGraph,
			markAsChanged: state.markAsChanged,
		})),
	);

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

	if (error) {
		return (
			<Box sx={{ padding: 3 }}>
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={handleRefresh}>
							Повторить
						</Button>
					}
				>
					Ошибка загрузки коммитов: {error.message}
				</Alert>
			</Box>
		);
	}

	return (
		<Box>
			<Header>
				<Button onClick={() => handleImport("s2t")} title="Импорт S2T">
					Импорт S2T
				</Button>
			</Header>

			<GridWrapper height="-webkit-fill-available">
				<AgGridReact<JsonCommitItem>
					rowData={commitsList}
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					pagination={true}
					paginationPageSize={20}
					paginationPageSizeSelector={[10, 20, 50, 100]}
					loading={isLoading}
					theme={
						mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
					}
					loadingOverlayComponent={() => (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								height: "100%",
							}}
						>
							<Typography>Загрузка коммитов...</Typography>
						</div>
					)}
					noRowsOverlayComponent={() => (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								height: "100%",
							}}
						>
							<Typography color="text.secondary">
								{showAllGraphs
									? "Коммиты не найдены во всех JSONах"
									: "Коммиты не найдены в текущем JSONе"}
							</Typography>
						</div>
					)}
					animateRows={true}
					enableCellTextSelection={true}
					ensureDomOrder={true}
					maintainColumnOrder={true}
				/>
			</GridWrapper>
		</Box>
	);
};

const GridWrapper = styled(Flex)`
	zoom: 0.8;
	& > div {
		width: 100%;
	}
`;
