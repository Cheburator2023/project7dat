import React, { useState, useRef, useEffect } from "react";
import {
	Tabs,
	Tab,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Box,
	Typography,
	TextField,
	List,
	ListItem,
	ListItemText,
	useColorScheme,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "../../theme/ag-grid/agGridCustomTheme";

import { useDataLineageStore } from "../../stores/dataLineageStore";
import type {
	DataLineageEntity,
	DataLineageMapping,
	DataLineageAttribute,
} from "../../types/dataLineage";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useShallow } from "zustand/react/shallow";

// Пропсы для дочерних компонентов
interface EntitiesTableProps {
	entities: DataLineageEntity[];
	showType: boolean;
}

interface AttributesTableProps {
	attributes: DataLineageAttribute[];
}

const AttributesTable: React.FC<AttributesTableProps> = ({ attributes }) => {
	if (!attributes || attributes.length === 0) return null;

	return (
		<Box
			sx={{
				maxHeight: 230,
				overflow: "auto",
				border: 1,
				borderColor: "divider",
				borderRadius: 1,
			}}
		>
			<List dense>
				{attributes.map((attr) => (
					<ListItem key={attr.name} divider>
						<ListItemText
							primary={`${attr.name} (${attr.type})`}
							secondary={attr.comment}
						/>
					</ListItem>
				))}
			</List>
		</Box>
	);
};

export const MappingItem = ({
	mapping,
	entities,
}: {
	mapping: DataLineageMapping;
	entities: DataLineageEntity[];
}) => {
	const targetEntity = entities.find((e) => e.id === mapping.entityId);

	const mappingData =
		mapping.deps
			?.flatMap((dep) => dep.attrMaps || [])
			.map((item, index) => ({
				id: `${item.src}-${item.dst}-${index}`,
				src: item.src,
				dst: item.dst,
			})) || [];

	const dependencyData =
		mapping.deps?.flatMap(
			(dep, depIndex) =>
				dep.atrDeps?.map((atrDep, atrIndex) => ({
					id: `${dep.entityId}-${atrDep.attr}-${depIndex}-${atrIndex}`,
					sourceEntity:
						entities.find((e) => e.id === dep.entityId)?.name || dep.entityId,
					sourceAttribute: atrDep.attr,
					linkTypes: atrDep.linkTypes?.join(", ") || "",
				})) || [],
		) || [];

	return (
		<Accordion>
			<AccordionSummary expandIcon={<ExpandMore />}>
				<Typography variant="h6">
					{targetEntity?.name || `Entity ${mapping.entityId}`}
				</Typography>
			</AccordionSummary>
			<AccordionDetails>
				<Box sx={{ mb: 2 }}>
					<Typography variant="subtitle2" gutterBottom>
						Цель:
					</Typography>
					<AttributesTable
						attributes={
							targetEntity?.attrSeq?.map((attr, index) => ({
								id: `${targetEntity.id}-${attr.name}-${index}`,
								name: attr.name,
								type: attr.type,
								comment: attr.comment,
							})) || []
						}
					/>
				</Box>

				{mappingData.length > 0 && (
					<Box sx={{ mb: 2 }}>
						<Typography variant="subtitle2" gutterBottom>
							Маппинги атрибутов:
						</Typography>
						<Box
							sx={{
								maxHeight: 230,
								overflow: "auto",
								border: 1,
								borderColor: "divider",
								borderRadius: 1,
							}}
						>
							<List dense>
								{mappingData.map((mapping) => (
									<ListItem key={mapping.id} divider>
										<ListItemText primary={`${mapping.src} → ${mapping.dst}`} />
									</ListItem>
								))}
							</List>
						</Box>
					</Box>
				)}

				{dependencyData.length > 0 && (
					<Box sx={{ mt: 2 }}>
						<Typography variant="subtitle2" gutterBottom>
							Зависимости атрибутов:
						</Typography>
						<Box
							sx={{
								maxHeight: 230,
								overflow: "auto",
								border: 1,
								borderColor: "divider",
								borderRadius: 1,
							}}
						>
							<List dense>
								{dependencyData.map((dep) => (
									<ListItem key={dep.id} divider>
										<ListItemText
											primary={`${dep.sourceEntity}.${dep.sourceAttribute}`}
											secondary={dep.linkTypes}
										/>
									</ListItem>
								))}
							</List>
						</Box>
					</Box>
				)}
			</AccordionDetails>
		</Accordion>
	);
};

const VirtualizedMappings = ({
	mappings,
	entities,
}: {
	mappings: DataLineageMapping[];
	entities: DataLineageEntity[];
}) => {
	if (!mappings || mappings.length === 0) {
		return (
			<Typography variant="body2" color="text.secondary">
				Нет доступных маппингов
			</Typography>
		);
	}

	return (
		<Box sx={{ width: "100%", zoom: 0.7 }}>
			{mappings.map((mapping, index) => (
				<Box key={`mapping-${mapping.id || "unknown"}-${index}`} sx={{ mb: 1 }}>
					<MappingItem mapping={mapping} entities={entities} />
				</Box>
			))}
		</Box>
	);
};

const EntitiesTable = ({ entities, showType }: EntitiesTableProps) => {
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
		{
			field: "name",
			headerName: "Название",
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
		{ field: "namespace", headerName: "Пространство имен", flex: 1 },
		{
			field: "attrSeq",
			headerName: "Атрибуты",
			flex: 1,
			cellRenderer: (params: any) => params.value?.length || 0,
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
		if (enableSyncScroll) {
			selectNode(
				event.data.originalId,
				event.event.ctrlKey || event.event.metaKey,
			);
		}
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
			{entities && entities.length > 20 && (
				<TextField
					label="Поиск сущностей"
					variant="outlined"
					size="small"
					value={searchTerm}
					onChange={handleSearchChange}
					sx={{ mb: 2, width: "100%" }}
				/>
			)}
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

export const DataMart = () => {
	const [activeTab, setActiveTab] = useState(0);
	const { currentGraph } = useDataLineageStore();

	const dataMarts = currentGraph?.entities?.filter((e) => e.modified) || [];
	const sourceEntities =
		currentGraph?.entities?.filter((e) => !e.modified) || [];
	const mappings = currentGraph?.mappings || [];
	const entities = currentGraph?.entities || [];

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	return (
		<Box sx={{ p: 2, "& .MuiDataGrid-footerContainer": { display: "none" } }}>
			{dataMarts.length > 0 && (
				<Card sx={{ mb: 2 }} variant="outlined">
					<CardHeader
						title={
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Chip label="ВИТРИНЫ ДАННЫХ" color="error" size="small" />
								<Typography variant="h6">Целевые сущности</Typography>
							</Box>
						}
					/>
					<CardContent>
						<EntitiesTable entities={dataMarts} showType={false} />
					</CardContent>
				</Card>
			)}

			<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
				<Tabs value={activeTab} onChange={handleTabChange}>
					<Tab label="Исходные сущности" />
					<Tab label="Маппинги" />
				</Tabs>
			</Box>

			<Box sx={{ mt: 2 }}>
				{activeTab === 0 && (
					<EntitiesTable entities={sourceEntities} showType={true} />
				)}
				{activeTab === 1 && (
					<VirtualizedMappings mappings={mappings} entities={entities} />
				)}
			</Box>
		</Box>
	);
};
