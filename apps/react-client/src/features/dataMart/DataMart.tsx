import { useMemo } from "react";

import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import type { DataLineageEntity } from "@react-client/types/dataLineage";
import type { ColDef } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

interface DataLineageEntityRow extends DataLineageEntity {
	modifiedText: string;
	typeText: string;
	attributeCount: number;
}

export const DataMart = () => {
	const { currentGraph, selectedNodes, selectNode } = useDataLineageStore();

	const rowData = useMemo<DataLineageEntityRow[]>(() => {
		if (!currentGraph) return [];

		return currentGraph.entities.map((entity) => ({
			...entity,
			modifiedText: entity.modified ? "Таргет" : "Источник",
			typeText: entity.type === "table" ? "Таблица" : "Представление",
			attributeCount: entity.attrSeq?.length || 0,
		}));
	}, [currentGraph]);

	const columnDefs = useMemo<ColDef<DataLineageEntityRow>[]>(
		() => [
			{
				field: "name",
				headerName: "Название",
				flex: 2,
				sortable: true,
				filter: true,
			},
			{
				field: "typeText",
				headerName: "Тип",
				flex: 1,
				sortable: true,
				filter: true,
			},
			{
				field: "modifiedText",
				headerName: "Роль",
				flex: 1,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					const color = params.data.modified ? "green" : "blue";
					return `<span style="color: ${color}; font-weight: bold;">${params.value}</span>`;
				},
			},
			{
				field: "namespace",
				headerName: "Схема",
				flex: 1.5,
				sortable: true,
				filter: true,
			},
			{
				field: "id",
				headerName: "Идентификатор",
				flex: 2,
				sortable: true,
				filter: true,
			},
			{
				field: "attributeCount",
				headerName: "Количество атрибутов",
				flex: 1.2,
				sortable: true,
				filter: "agNumberColumnFilter",
				cellRenderer: (params: any) => {
					const value = params.value;
					return value ? value.toLocaleString() : "0";
				},
			},
		],
		[],
	);

	const defaultColDef: ColDef = {
		flex: 1,
		resizable: true,
		sortable: true,
		filter: true,
	};

	const onSelectionChanged = (event: any) => {
		const selectedRows = event.api.getSelectedRows();
		if (selectedRows.length > 0) {
			selectNode(selectedRows[0].id, false);
		}
	};

	const onRowClicked = (event: any) => {
		selectNode(event.data.id, event.event.ctrlKey || event.event.metaKey);
	};

	return (
		<div style={{ width: "100%", height: "100%" }}>
			<AgGridReact<DataLineageEntityRow>
				rowData={rowData}
				columnDefs={columnDefs}
				defaultColDef={defaultColDef}
				rowSelection="multiple"
				onSelectionChanged={onSelectionChanged}
				onRowClicked={onRowClicked}
				animateRows={true}
				enableCellTextSelection={true}
				suppressRowClickSelection={false}
			/>
		</div>
	);
};
