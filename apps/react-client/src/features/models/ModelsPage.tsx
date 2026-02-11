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
import {
	DataLineageStore,
	useDataLineageStore,
} from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";
import { useDashboardStore } from "@react-client/features/dashboard/stores";
import { routes } from "@react-client/routing/routes";
import { EntityRow } from "@react-client/features/dashboard";
import { DataLineageGraph } from "@react-client/types/dataLineage";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";

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

// const mapJsonDataItemToModels = (item: JsonDataItem): any[] => {
// 	const data = item.data;
// 	const entities = data?.entities ?? [];
// 	const filterEntities = entities.filter(
// 		(entity) => entity.type === "input_vector",
// 	);

// 	return filterEntities.map((entity) => ({
// 		...entity,
// 		graphId: item.id,
// 		description:
// 			// entity может не иметь description в shared-схеме, поэтому подстраховываемся
// 			// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 			((entity as any).container_description as string | undefined) ||
// 			((entity as any).description as string | undefined) ||
// 			item.description ||
// 			data.desc.appName,
// 		updatedDate: item.container_change || item.entity_change,
// 	}));
// };

const mapGraphToModels = (graph: DataLineageGraph): Model[] => {
	const entities = graph?.entities ?? [];
	const filterEntities = entities.filter(
		(entity) => entity.type === "input_vector",
	);

	return filterEntities.map((entity) => ({
		...entity,
		graphId: graph.desc.appId,
		description:
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			((entity as any).container_description as string | undefined) ||
			entity.description ||
			graph.desc.appName,
		updatedDate: entity.entity_change,
	}));
};

const selector = (state: DataLineageStore) => ({
	currentGraph: state.currentGraph,
});

export const ModelsPage = () => {
	useCurrentDataLineageGraph();
	const [searchQuery, setSearchQuery] = useState("");
	const { mode } = useColorScheme();
	const { currentGraph } = useDataLineageStore(useShallow(selector));
	const { selectEntity } = useDashboardStore();

	// const { data: jsonDataList, isLoading, error } = useJsonDataList();
	const navigate = useNavigate();

	const baseModels = useMemo<Model[]>(() => {
		if (!currentGraph) {
			return [];
		}

		return mapGraphToModels(currentGraph);
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
