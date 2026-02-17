import { useState, useMemo, useCallback } from "react";

import { format, parseISO } from "date-fns/esm";
import { Box, TextField, InputAdornment, Chip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { Search } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, SortChangedEvent } from "ag-grid-community";
import { useNavigate } from "react-router-dom";

import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { PaginationToolbar } from "@react-client/common/grid/PaginationToolbar";
import { usePaginatedEntities } from "@react-client/api/hooks";
import { useEntitiesStore } from "@react-client/features/entities/stores";
import { routes } from "@react-client/routing/routes";

interface ModelRow {
	id: string;
	namespace: string;
	container_description?: string;
	entity_change: string;
	type: string;
}

export const ModelsPage = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(50);
	const [sortBy, setSortBy] = useState<string | undefined>(undefined);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
		undefined,
	);
	const { mode } = useColorScheme();
	const { selectEntity } = useEntitiesStore();
	const navigate = useNavigate();

	// Backend pagination — search is passed to backend
	const {
		data: paginatedData,
		isLoading,
		isFetching,
	} = usePaginatedEntities({
		page,
		limit: pageSize,
		search: searchQuery || undefined,
		type: "input_vector",
		sortBy,
		sortOrder,
	});

	// Backend уже фильтрует по type=input_vector
	const filteredModels: ModelRow[] = useMemo(() => {
		if (!paginatedData?.entities) return [];
		return paginatedData.entities.map((e) => ({
			id: e.id,
			namespace: e.namespace,
			container_description: e.container_description,
			entity_change: e.entity_change,
			type: e.type,
		}));
	}, [paginatedData]);

	const totalPages = paginatedData?.totalPages ?? 1;
	const totalItems = paginatedData?.total ?? 0;

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value);
			setPage(1);
		},
		[],
	);

	const handlePageSizeChange = useCallback((size: number) => {
		setPageSize(size);
		setPage(1);
	}, []);

	const handleSortChanged = useCallback((event: SortChangedEvent<ModelRow>) => {
		const colState = event.api.getColumnState();
		const sorted = colState.find((c) => c.sort);
		if (sorted) {
			setSortBy(sorted.colId);
			setSortOrder(sorted.sort as "asc" | "desc");
		} else {
			setSortBy(undefined);
			setSortOrder(undefined);
		}
		setPage(1);
	}, []);

	const columnDefs: ColDef<ModelRow>[] = [
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
			field: "entity_change",
			width: 180,
			cellRenderer: ({ value }: { value: string }) => {
				if (!value) return "";
				try {
					return format(parseISO(value), "dd.MM.yyyy, HH:mm");
				} catch {
					return value;
				}
			},
		},
	];

	return (
		<div>
			<Header title="Модели">
				<Flex alignItems="center" gap={10} width="100%">
					<TextField
						fullWidth
						variant="outlined"
						placeholder="Поиск моделей по названию, описанию..."
						value={searchQuery}
						onChange={handleSearchChange}
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

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					height: "100%",
				}}
			>
				<Box sx={{ flex: 1, minHeight: 0 }}>
					<AgGridReact<ModelRow>
						rowData={filteredModels}
						columnDefs={columnDefs}
						theme={
							mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
						}
						defaultColDef={{
							sortable: true,
							filter: false,
							resizable: true,
						}}
						onSortChanged={handleSortChanged}
						animateRows={true}
						rowSelection="single"
						onRowDoubleClicked={(event) => {
							if (event.data) {
								const encodedId = encodeURIComponent(event.data.id);
								selectEntity(encodedId);
								navigate(
									routes.modelCard.rootPath.replace(":entityId", encodedId),
								);
							}
						}}
						domLayout="normal"
						loading={isLoading}
						overlayNoRowsTemplate="Нет данных"
					/>
				</Box>

				<PaginationToolbar
					page={page}
					totalPages={totalPages}
					totalItems={totalItems}
					pageSize={pageSize}
					onPageChange={setPage}
					onPageSizeChange={handlePageSizeChange}
					isFetching={isFetching}
					itemLabel="моделей"
				/>
			</Box>
		</div>
	);
};
