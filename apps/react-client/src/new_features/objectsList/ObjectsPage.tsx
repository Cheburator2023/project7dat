import React, { useState, useMemo } from "react";
import {
	Box,
	Typography,
	TextField,
	InputAdornment,
	CircularProgress,
	Chip,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { Search as SearchIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ColDef, RowDoubleClickedEvent } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";
import type { JsonDataItem } from "@react-client/api/hooks/jsonDataApi";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";
import { TypeChip } from "@react-client/features/dashboard/atoms";
import { format, parseISO } from "date-fns/esm";
import { EntityRow } from "@react-client/features/dashboard";

interface ObjectItem {
	id: string;
	graphId?: string;
	object: string;
	objectType: string;
	description: string;
	entity_change?: string;
	modelId: string;
	database: string;
	process: string;
	processDescription: string;
	// Additional fields for attributes
	dataType?: string; // Attribute data type (e.g., string, int, etc.)
	entityType?: string; // Parent entity type (table, view, rdd)
	attributeCount?: number; // Number of attributes for model/datamart
}

const mapJsonDataItemToObjects = (item: JsonDataItem): ObjectItem[] => {
	const { id: graphId, name: jsonName, description, data } = item;

	const appId = data.desc?.appId ?? "";
	const appName = data.desc?.appName ?? "";

	return data?.entities?.flatMap((entity) => {
		const database = entity.namespace ?? appId;
		const process = appName || jsonName;
		const processDescription = description ?? (appName || jsonName);

		const rows: ObjectItem[] = [];

		// Уровень сущности (модель/витрина)
		rows.push({
			id: `${entity.id}`,
			graphId,
			object: entity.name ?? entity.id,
			objectType: entity.type,
			description: entity?.description ?? "",
			entity_change: entity.entity_change ?? "",
			modelId: entity.id,
			database,
			process,
			processDescription,
			entityType: entity.type,
			attributeCount: entity.attrSeq?.length ?? 0,
		});

		return rows;
	});
};

export const ObjectsPage: React.FC = () => {
	const { mode } = useColorScheme();
	const navigate = useNavigate();
	const [searchText, setSearchText] = useState("");

	const { currentGraph } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
		})),
	);
	const { isPending } = useCurrentDataLineageGraph();
	// const { data: jsonDataList, isLoading, error } = useJsonDataList();

	const baseData = useMemo<ObjectItem[]>(() => {
		if (!currentGraph) {
			return [];
		}
		return [{ data: currentGraph }].flatMap(mapJsonDataItemToObjects);
	}, [currentGraph]);

	const filteredData = useMemo(() => {
		const data = baseData;
		if (!searchText.trim()) {
			return data;
		}

		const searchLower = searchText.toLowerCase();
		return data.filter(
			(item) =>
				item.object?.toLowerCase().includes(searchLower) ||
				item.objectType?.toLowerCase().includes(searchLower) ||
				item.description?.toLowerCase().includes(searchLower) ||
				item.modelId?.toLowerCase().includes(searchLower) ||
				item.database?.toLowerCase().includes(searchLower) ||
				item.process?.toLowerCase().includes(searchLower) ||
				item.processDescription?.toLowerCase().includes(searchLower),
		);
	}, [baseData, searchText]);

	const columnDefs: ColDef<ObjectItem>[] = useMemo(
		() => [
			{
				headerName: "БД",
				field: "database",
				width: 150,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2" fontFamily="monospace">
							{params.value || "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "Объект",
				field: "object",
				width: 200,
				pinned: "left",
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2" fontWeight="medium">
							{params.value || "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "Тип",
				field: "objectType",
				width: 130,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					return <TypeChip type={params.value} />;
				},
			},
			{
				headerName: "Описание",
				field: "description",
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
				field: "entity_change",
				headerName: "Изменено",
				flex: 1,
				cellRenderer: ({ value, data }: { value: string; data: EntityRow }) => {
					// const highlights = highlightsMap.get(data.id);
					// const highlightedNs = highlights?.get("entity_change");
					// if (highlightedNs) {
					// 	return (
					// 		<span
					// 			dangerouslySetInnerHTML={{ __html: highlightedNs }}
					// 			style={{ display: "block" }}
					// 		/>
					// 	);
					// }
					if (value) {
						return format(parseISO(value), "dd.MM.yyyy, HH:mm");
					}
				},
			},
		],
		[navigate],
	);

	const defaultColDef = useMemo(
		() => ({
			resizable: true,
			sortable: true,
			filter: true,
		}),
		[],
	);

	const downloadFile = (content: string, fileName: string) => {
		const blob = new Blob([content], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const _handleExportJson = () => {
		const payload = {
			generatedAt: new Date().toISOString(),
			items: filteredData,
		};
		downloadFile(JSON.stringify(payload, null, 2), "dl_objects_export.json");
	};

	if (isPending) {
		return (
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "50vh",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<div>
			<Header>
				<Flex alignItems="center" gap={10} width="100%">
					<TextField
						fullWidth
						variant="outlined"
						placeholder="Поиск по объектам..."
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
						}}
					/>
					<Chip
						label={`${filteredData.length} объектов`}
						color="primary"
						variant="outlined"
					/>
				</Flex>
			</Header>

			<Box sx={{ flex: 1, minHeight: 0 }}>
				<AgGridReact<ObjectItem>
					rowData={filteredData}
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					pagination={true}
					paginationPageSize={20}
					paginationPageSizeSelector={[10, 20, 50, 100]}
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
							<Typography>Загрузка объектов...</Typography>
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
								{searchText.trim()
									? "Объекты не найдены по запросу"
									: "Объекты не найдены"}
							</Typography>
						</div>
					)}
					animateRows={true}
					enableCellTextSelection={true}
					ensureDomOrder={true}
					maintainColumnOrder={true}
					onRowDoubleClicked={(event: RowDoubleClickedEvent<ObjectItem>) => {
						if (event.data) {
							navigate(`/objects/${encodeURIComponent(event.data.id)}`);
						}
					}}
				/>
			</Box>
		</div>
	);
};
