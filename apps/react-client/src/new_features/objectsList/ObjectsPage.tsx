import React, { useState, useMemo } from "react";
import {
	Box,
	Typography,
	TextField,
	InputAdornment,
	Button,
	Alert,
	CircularProgress,
	IconButton,
	Tooltip,
} from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import {
	Search as SearchIcon,
	Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { ChangelogButton } from "@react-client/new_features/changelog/ChangelogButton";
import { useJsonDataList } from "@react-client/api/hooks";
import type { JsonDataItem } from "@react-client/api/hooks/jsonDataApi";

interface ObjectItem {
	id: string;
	graphId?: string;
	object: string;
	objectType: "Модель" | "Витрина" | "Признак";
	description: string;
	modelId: string;
	database: string;
	process: string;
	processDescription: string;
	// Additional fields for attributes
	dataType?: string; // Attribute data type (e.g., string, int, etc.)
	entityType?: string; // Parent entity type (table, view, rdd)
	attributeCount?: number; // Number of attributes for model/vitrina
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
			id: `${graphId}::${entity.id}`,
			graphId,
			object: entity.name ?? entity.id,
			objectType: entity.type === "view" ? "Витрина" : "Модель",
			description: processDescription,
			modelId: entity.id,
			database,
			process,
			processDescription,
			entityType: entity.type,
			attributeCount: entity.attrSeq?.length ?? 0,
		});

		// Уровень признаков (атрибуты сущности)
		if (entity.attrSeq) {
			for (const attr of entity.attrSeq) {
				rows.push({
					id: `${graphId}::${entity.id}::${attr.name}`,
					graphId,
					object: attr.name,
					objectType: "Признак",
					description: attr.comment ?? "",
					modelId: entity.id,
					database,
					process,
					processDescription,
					dataType: attr.type, // Include attribute data type
					entityType: entity.type,
				});
			}
		}

		return rows;
	});
};

export const ObjectsPage: React.FC = () => {
	const { mode } = useColorScheme();
	const navigate = useNavigate();
	const [searchText, setSearchText] = useState("");
	const { data: jsonDataList, isLoading, error } = useJsonDataList();

	const baseData = useMemo<ObjectItem[]>(() => {
		if (!jsonDataList) {
			return [];
		}
		return jsonDataList.flatMap(mapJsonDataItemToObjects);
	}, [jsonDataList]);

	const filteredData = useMemo(() => {
		const data = baseData;
		if (!searchText.trim()) {
			return data;
		}

		const searchLower = searchText.toLowerCase();
		return data.filter(
			(item) =>
				item.object.toLowerCase().includes(searchLower) ||
				item.objectType.toLowerCase().includes(searchLower) ||
				item.description.toLowerCase().includes(searchLower) ||
				item.modelId.toLowerCase().includes(searchLower) ||
				item.database.toLowerCase().includes(searchLower) ||
				item.process.toLowerCase().includes(searchLower) ||
				item.processDescription.toLowerCase().includes(searchLower),
		);
	}, [baseData, searchText]);

	const columnDefs: ColDef<ObjectItem>[] = useMemo(
		() => [
			{
				headerName: "Действия",
				field: "id",
				width: 100,
				pinned: "left",
				sortable: false,
				filter: false,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1, display: "flex", justifyContent: "center" }}>
						<Tooltip title="Просмотр карточки">
							<IconButton
								size="small"
								color="primary"
								onClick={() =>
									navigate(`/objects/${encodeURIComponent(params.data.id)}`)
								}
							>
								<VisibilityIcon fontSize="small" />
							</IconButton>
						</Tooltip>
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
				headerName: "Тип объекта",
				field: "objectType",
				width: 130,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					const colors: Record<string, { bg: string; color: string }> = {
						Модель: { bg: "#1976d2", color: "#fff" },
						Витрина: { bg: "#9c27b0", color: "#fff" },
						Признак: { bg: "#00897b", color: "#fff" },
					};
					const style = colors[params.value] || { bg: "#666", color: "#fff" };

					return (
						<Box sx={{ padding: 0, display: "flex", alignItems: "center" }}>
							<Box
								sx={{
									background: style.bg,
									color: style.color,
									padding: "0 8px",
									borderRadius: 1,
									fontSize: "0.75rem",
									fontWeight: 500,
								}}
							>
								{params.value || "—"}
							</Box>
						</Box>
					);
				},
			},
			{
				headerName: "Тип данных",
				field: "dataType",
				width: 120,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					if (!params.value) return null;
					return (
						<Box sx={{ padding: 1 }}>
							<Typography
								variant="body2"
								fontFamily="monospace"
								sx={{
									background: "#f5f5f5",
									padding: "2px 6px",
									borderRadius: 1,
									fontSize: "0.75rem",
								}}
							>
								{params.value}
							</Typography>
						</Box>
					);
				},
			},
			{
				headerName: "Кол-во атр.",
				field: "attributeCount",
				width: 100,
				sortable: true,
				filter: "agNumberColumnFilter",
				cellRenderer: (params: any) => {
					if (params.data?.objectType === "Признак") return null;
					return (
						<Box sx={{ padding: 1 }}>
							<Typography variant="body2" color="text.secondary">
								{params.value ?? 0}
							</Typography>
						</Box>
					);
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
				headerName: "Модель ID",
				field: "modelId",
				width: 120,
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
				headerName: "Процесс",
				field: "process",
				width: 180,
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
				headerName: "Описание процесса",
				field: "processDescription",
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
				headerName: "История",
				field: "graphId",
				width: 140,
				pinned: "right",
				sortable: false,
				filter: false,
				cellRenderer: (params: any) => (
					<ChangelogButton graphId={params.data.graphId} size="small" />
				),
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

	const handleExportJson = () => {
		const payload = {
			generatedAt: new Date().toISOString(),
			items: filteredData,
		};
		downloadFile(JSON.stringify(payload, null, 2), "dl_objects_export.json");
	};

	const handleExportS2T = () => {
		const s2tPayload = {
			generatedAt: new Date().toISOString(),
			format: "S2T-JSON",
			objects: filteredData.map((item) => ({
				objectName: item.object,
				objectType: item.objectType,
				modelId: item.modelId,
				database: item.database,
				process: item.process,
				description: item.description,
			})),
		};
		downloadFile(JSON.stringify(s2tPayload, null, 2), "dl_s2t_export.json");
	};

	if (isLoading) {
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

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">
					Ошибка загрузки объектов: {error.message}
				</Alert>
			</Box>
		);
	}

	return (
		<Box>
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
					<Button variant="outlined" size="small" onClick={handleExportJson}>
						Экспорт JSON
					</Button>
					<Button variant="outlined" size="small" onClick={handleExportS2T}>
						Экспорт S2T JSON
					</Button>
					<Typography variant="body2" color="text.secondary">
						{filteredData.length} объектов
					</Typography>
				</Flex>
			</Header>

			<Spacer space={6} />

			<GridWrapper height="calc(100vh - 120px)">
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
				/>
			</GridWrapper>
		</Box>
	);
};

const GridWrapper = styled(Flex)`
	zoom: 1;

	& > div {
		width: 100%;
	}
`;
