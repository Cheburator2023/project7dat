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
			owner: node.metadata.owner || "Unknown",
			tagsString: node.metadata.tags.join(", "),
			location: node.metadata.location || "N/A",
			rowCount: node.metadata.rowCount || null,
			size: node.metadata.size || null,
		}));
	}, [currentGraph]);

	const columnDefs = useMemo<ColDef<DataLineageNodeRow>[]>(
		() => [
			{
				field: "name",
				headerName: "Name",
				flex: 2,
				sortable: true,
				filter: true,
			},
			{
				field: "type",
				headerName: "Type",
				flex: 1,
				sortable: true,
				filter: true,
			},
			{
				field: "status",
				headerName: "Status",
				flex: 1,
				sortable: true,
				filter: true,
				cellRenderer: (params: any) => {
					const status = params.value;
					const color =
						status === "active"
							? "green"
							: status === "inactive"
								? "orange"
								: status === "deprecated"
									? "red"
									: "gray";
					return `<span style="color: ${color}; font-weight: bold;">${status}</span>`;
				},
			},
			{
				field: "owner",
				headerName: "Owner",
				flex: 1.5,
				sortable: true,
				filter: true,
			},
			{
				field: "tagsString",
				headerName: "Tags",
				flex: 2,
				sortable: true,
				filter: true,
			},
			{
				field: "location",
				headerName: "Location",
				flex: 2,
				sortable: true,
				filter: true,
			},
			{
				field: "rowCount",
				headerName: "Row Count",
				flex: 1,
				sortable: true,
				filter: "agNumberColumnFilter",
				cellRenderer: (params: any) => {
					const value = params.value;
					return value ? value.toLocaleString() : "N/A";
				},
			},
			{
				field: "size",
				headerName: "Size (bytes)",
				flex: 1,
				sortable: true,
				filter: "agNumberColumnFilter",
				cellRenderer: (params: any) => {
					const value = params.value;
					if (!value) return "N/A";

					const units = ["B", "KB", "MB", "GB", "TB"];
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
