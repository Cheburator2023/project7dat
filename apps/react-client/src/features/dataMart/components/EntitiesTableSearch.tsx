import { useNavigate } from "react-router";
import React, { useEffect, useRef, useState } from "react";
import { Box, Chip, TextField, useColorScheme } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";
import { ColDef } from "ag-grid-community";
import { Spacer } from "@react-client/common/primitives/Spacer";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { DataLineageEntity } from "@react-client/types/dataLineage";

interface EntitiesTableProps {
	entities: DataLineageEntity[];
	showType: boolean;
}

export const EntitiesTableSearch: React.FC = ({
	entities,
	showType,
}: EntitiesTableProps) => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");
	const { mode } = useColorScheme();
	const gridRef = useRef<AgGridReact>(null);
	const { selectNode, selectedNodes, enableSyncScroll, isNeedReveal } =
		useDataLineageStore(
			useShallow((state) => ({
				selectNode: state.selectNode,
				selectedNodes: state.selectedNodes,
				enableSyncScroll: state.enableSyncScroll,
				isNeedReveal: state.isNeedReveal,
			})),
		);

	const columnDefs: ColDef[] = [
		{ field: "originalId", headerName: "ID", flex: 1 },
		{ field: "namespace", headerName: "База данных", flex: 1 },
		{
			field: "name",
			headerName: "Наименование",
			flex: 1,
			cellRenderer: (params: any) => {
				return (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<span>{params.value}</span>
						{params.data.modified && (
							<Chip label="ВИТРИНА ДАННЫХ" color="error" size="small" />
						)}
					</Box>
				);
			},
		},
		...(showType
			? [
					{
						field: "type",
						headerName: "Тип",
						flex: 1,
						cellRenderer: (params: any) => (
							<Chip
								label={params.value}
								color={params.value === "table" ? "primary" : "success"}
								size="small"
							/>
						),
					},
				]
			: []),
		{
			field: "description",
			headerName: "Описание",
			flex: 1,
			cellRenderer: (params: any) => params.value?.length || "отсутствует",
		},
		{
			field: "entity_change",
			headerName: "Изменено",
			flex: 1,
			cellRenderer: (params: any) => params.value?.length || "отсутствует",
		},
	];

	const filteredEntities = !entities
		? []
		: !searchTerm
			? entities
			: entities.filter(
					(entity) =>
						entity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
						entity.namespace?.toLowerCase().includes(searchTerm.toLowerCase()),
				);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	const handleRowClicked = (event: any) => {
		selectNode(
			event.data.originalId,
			event.event.ctrlKey || event.event.metaKey,
		);
		navigate(`datamart/${event.data.namespace}+${event.data.name}`);
	};

	// Effect to scroll to selected row when selection changes from outside
	useEffect(() => {
		if (
			selectedNodes.length > 0 &&
			enableSyncScroll &&
			isNeedReveal("editor") &&
			gridRef.current?.api
		) {
			const selectedId = selectedNodes[0];
			const api = gridRef.current.api;
			const rowNode = api.getRowNode(selectedId);

			if (rowNode) {
				api.ensureIndexVisible(rowNode.rowIndex!, "middle");
				api.setFocusedCell(rowNode.rowIndex!, "originalId");
			}
		}
	}, [selectedNodes, enableSyncScroll, isNeedReveal]);

	return (
		<Box sx={{ width: "100%" }}>
			<TextField
				label="Поиск сущностей"
				variant="outlined"
				size="small"
				value={searchTerm}
				onChange={handleSearchChange}
				sx={{ mb: 2, width: "100%" }}
			/>
			<Spacer />
			<Box
				sx={{
					height: 666,
					width: "100%",
				}}
			>
				<AgGridReact
					ref={gridRef}
					theme={
						mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
					}
					rowData={filteredEntities.map((entity, index) => ({
						...entity,
						id: `${entity.id}-${index}`,
						originalId: entity.id,
					}))}
					columnDefs={columnDefs}
					rowSelection="multiple"
					suppressRowClickSelection={false}
					onRowClicked={handleRowClicked}
					domLayout="normal"
					getRowId={(params) => params.data.originalId}
				/>
			</Box>
		</Box>
	);
};
