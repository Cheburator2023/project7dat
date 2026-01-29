import { useState, useMemo } from "react";

import { format, parseISO } from "date-fns/esm";
import {
	Box,
	TextField,
	InputAdornment,
	Chip,
	CircularProgress,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { Search } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useNavigate } from "react-router-dom";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { DataLineageEntity } from "@data-lineage/shared-schemas";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";
import type { JsonDataItem } from "@react-client/api/hooks/jsonDataApi";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";
import { useDashboardStore } from "@react-client/features/dashboard/stores";
import { routes } from "@react-client/routing/routes";

// Extended interface based on DataLineageEntity for UI display purposes
export interface Model extends DataLineageEntity {
	graphId?: string;
	description?: string;
	container_description?: string;
	createdDate?: string;
	updatedDate?: string;
	status?: "active" | "draft" | "archived";
	author?: string;
	version?: string;
	tags?: string[];
	lastAccessDate?: string;
	size?: string;
	objectsCount?: number;
	businessType?: "analytical" | "operational" | "dimensional";
}

const mapJsonDataItemToModels = (item: JsonDataItem): any[] => {
	const data = item.data;
	const entities = data?.entities ?? [];
	const filterEntities = entities.filter(
		(entity) => entity.type === "input_vector",
	);

	return filterEntities.map((entity) => ({
		...entity,
		graphId: item.id,
		description:
			// entity может не иметь description в shared-схеме, поэтому подстраховываемся
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			((entity as any).container_description as string | undefined) ||
			((entity as any).description as string | undefined) ||
			item.description ||
			data.desc.appName,
		updatedDate: item.container_change || item.entity_change,
	}));
};

const getStatusColor = (status: Model["status"]) => {
	switch (status) {
		case "active":
			return "success";
		case "draft":
			return "warning";
		case "archived":
			return "error";
		default:
			return "default";
	}
};

const _TYPE_COLORS: Record<string, string> = {
	table: "#1976d2",
	view: "#9c27b0",
	rdd: "#f57c00",
	unresolved: "#c2185b",
};

const _StatusChipRenderer = ({ value }: { value: Model["status"] }) => {
	const statusLabels = {
		active: "Активная",
		draft: "Черновик",
		archived: "Архивная",
	};

	if (!value) return null;

	return (
		<Chip
			label={statusLabels[value]}
			color={getStatusColor(value) as any}
			size="small"
		/>
	);
};

const _TagsRenderer = ({ value }: { value: string[] }) => {
	return (
		<Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
			{value.map((tag, index) => (
				<Chip
					key={index}
					label={tag}
					size="small"
					variant="outlined"
					sx={{ fontSize: "0.7rem", height: "20px" }}
				/>
			))}
		</Box>
	);
};

export const ModelsPage = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const { mode } = useColorScheme();

	const { currentGraph } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
		})),
	);

	const { selectEntity } = useDashboardStore();

	const { isPending } = useCurrentDataLineageGraph();
	// const { data: jsonDataList, isLoading, error } = useJsonDataList();
	const navigate = useNavigate();

	const baseModels = useMemo<Model[]>(() => {
		if (!currentGraph) {
			return [];
		}

		return [{ data: currentGraph }].flatMap(mapJsonDataItemToModels);
	}, [currentGraph]);

	const filteredModels = useMemo(() => {
		if (!searchQuery.trim()) return baseModels;

		const query = searchQuery.toLowerCase();
		return baseModels.filter(
			(model) =>
				(model.name?.toLowerCase().includes(query) ?? false) ||
				(model.description?.toLowerCase().includes(query) ?? false),
		);
	}, [baseModels, searchQuery]);

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

	// if (error) {
	// 	return (
	// 		<Box sx={{ p: 3 }}>
	// 			<Alert severity="error">Ошибка загрузки моделей: {error.message}</Alert>
	// 		</Box>
	// 	);
	// }

	const columnDefs: ColDef<Model>[] = [
		{
			headerName: "Название",
			field: "namespace",
			flex: 2,
			minWidth: 200,
			cellStyle: { fontWeight: "bold" },
		},
		{
			headerName: "Описание",
			field: "container_description",
			flex: 3,
			minWidth: 300,
			autoHeight: true,
		},
		{
			headerName: "Обновлена",
			field: "updatedDate",
			width: 120,
			cellRenderer: ({ value, data }: { value: string; data: EntityRow }) => {
				if (data.entity_change) {
					return format(parseISO(data.entity_change), "dd.MM.yyyy, HH:mm");
				}
			},
		},
	];

	return (
		<div>
			<Header>
				<Flex alignItems="center" gap={10} width="100%">
					<TextField
						fullWidth
						variant="outlined"
						placeholder="Поиск моделей по названию, описанию, автору или тегам..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						size="small"
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search />
								</InputAdornment>
							),
						}}
					/>
					<Chip
						label={`${filteredModels.length} моделей`}
						color="primary"
						variant="outlined"
					/>
				</Flex>
			</Header>

			<Box sx={{ flex: 1, minHeight: 0 }}>
				<AgGridReact<Model>
					rowData={filteredModels}
					columnDefs={columnDefs}
					theme={
						mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
					}
					defaultColDef={{
						sortable: true,
						filter: true,
						resizable: true,
					}}
					pagination={true}
					paginationPageSize={20}
					paginationPageSizeSelector={[10, 20, 50, 100]}
					animateRows={true}
					rowSelection="single"
					onRowDoubleClicked={(event) => {
						if (event.data) {
							console.log(event.data);
							const encodedId = encodeURIComponent(event.data.id);
							selectEntity(encodedId);
							navigate(
								routes.modelCard.rootPath.replace(":entityId", encodedId),
							);
						}
					}}
					domLayout="normal"
				/>
			</Box>
		</div>
	);
};
