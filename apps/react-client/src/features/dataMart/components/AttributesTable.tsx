import { DataLineageAttribute } from "@react-client/types/dataLineage";
import React, { useRef, useState } from "react";
import { Box, Chip, TextField, useColorScheme } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import { Spacer } from "@react-client/common/primitives/Spacer";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { ColDef } from "ag-grid-community";

interface AttributesTableProps {
	attributes: DataLineageAttribute[];
}

export const AttributesTable: React.FC<AttributesTableProps> = ({
	attributes,
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const { mode } = useColorScheme();
	const gridRef = useRef<AgGridReact>(null);

	const columnDefs: ColDef[] = [
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
		{
			field: "comment",
			headerName: "Описание",
			flex: 1,
			cellRenderer: (params: any) => params.value?.length || "отсутствует",
		},
	];

	const filteredEntities = !attributes
		? []
		: !searchTerm
			? attributes
			: attributes.filter((entity) =>
					entity.name?.toLowerCase().includes(searchTerm.toLowerCase()),
				);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
	};

	if (!attributes || attributes.length === 0) return null;

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
						id: `${entity.id || entity.name}-${index}`,
						originalId: entity.id,
					}))}
					columnDefs={columnDefs}
					rowSelection="multiple"
					suppressRowClickSelection={false}
					// onRowClicked={handleRowClicked}
					domLayout="normal"
					getRowId={(params) => params.data.originalId}
				/>
			</Box>
		</Box>
	);
};
