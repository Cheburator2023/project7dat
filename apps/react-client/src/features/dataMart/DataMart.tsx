import { useMemo } from "react";

import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import type { DataLineageNode } from "@react-client/types/dataLineage";
import type { ColDef } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

interface DataLineageNodeRow extends DataLineageNode {
	owner: string;
	tagsString: string;
	location: string;
	rowCount: number | null;
	size: number | null;
}

export const DataMart = () => {
	const { currentGraph, selectedNodes, selectNode } = useDataLineageStore();

	const rowData = useMemo<DataLineageNodeRow[]>(() => {
		if (!currentGraph) return [];

		return currentGraph.nodes.map((node) => ({
			...node,
			owner: node.metadata.owner || "Неизвестно",
			tagsString: node.metadata.tags.join(", "),
			location: node.metadata.location || "Н/Д",
			rowCount: node.metadata.rowCount || null,
			size: node.metadata.size || null,
		}));
	}, [currentGraph]);

	const columnDefs = useMemo<ColDef<DataLineageNodeRow>[]>(
		() => [
			{
				field: "name",
				headerName: "Название",
				flex: 2,
				sortable: true,
				filter: true,
			},
			{
				field: "type",
				headerName: "Тип",
				flex: 1,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					const typeMap: Record<string, string> = {
						source: "Источник",
						transformation: "Трансформация",
						destination: "Назначение",
						dataset: "Датасет",
						model: "Модель",
						view: "Представление",
					};
					return typeMap[params.value] || params.value;
				},
			},
			{
				field: "status",
				headerName: "Статус",
				flex: 1,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					const statusMap: Record<string, { label: string; color: string }> = {
						active: { label: "Активный", color: "green" },
						inactive: { label: "Неактивный", color: "orange" },
						deprecated: { label: "Устаревший", color: "red" },
						error: { label: "Ошибка", color: "red" },
					};
					const statusInfo = statusMap[params.value] || {
						label: params.value,
						color: "gray",
					};
					return `<span style="color: ${statusInfo.color}; font-weight: bold;">${statusInfo.label}</span>`;
				},
			},
			{
				field: "owner",
				headerName: "Владелец",
				flex: 1.5,
				sortable: true,
				filter: true,
			},
			{
				field: "tagsString",
				headerName: "Теги",
				flex: 2,
				sortable: true,
				filter: true,
			},
			{
				field: "location",
				headerName: "Расположение",
				flex: 2,
				sortable: true,
				filter: true,
			},
			{
				field: "rowCount",
				headerName: "Количество строк",
				flex: 1.2,
				sortable: true,
				filter: "agNumberColumnFilter",
				cellRenderer: (params: any) => {
					const value = params.value;
					return value ? value.toLocaleString() : "Н/Д";
				},
			},
			{
				field: "size",
				headerName: "Размер",
				flex: 1,
				sortable: true,
				filter: "agNumberColumnFilter",
				cellRenderer: (params: any) => {
					const value = params.value;
					if (!value) return "Н/Д";

					const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
					let size = value;
					let unitIndex = 0;

					while (size >= 1024 && unitIndex < units.length - 1) {
						size /= 1024;
						unitIndex++;
					}

					return `${size.toFixed(1)} ${units[unitIndex]}`;
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
			<AgGridReact<DataLineageNodeRow>
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
