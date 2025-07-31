import React, { useState, useMemo, memo, useCallback } from "react";
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
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FixedSizeList as List } from "react-window";
import { useDataLineageStore } from "../../stores/dataLineageStore";
import type {
	DataLineageEntity,
	DataLineageMapping,
	DataLineageAttribute,
} from "../../types/dataLineage";
import { Spacer } from "@react-client/common/primitives/Spacer";

// Пропсы для дочерних компонентов
interface EntitiesTableProps {
	entities: DataLineageEntity[];
	showType: boolean;
}

interface AttributesTableProps {
	attributes: DataLineageAttribute[];
}

const mappingColumnDefs = [
	{ field: "src", headerName: "Исходный атрибут" },
	{ field: "dst", headerName: "Целевой атрибут" },
];

const columnDefs: GridColDef[] = [
	{ field: "name", headerName: "Название", flex: 1 },
	{ field: "type", headerName: "Тип", flex: 1 },
	{ field: "comment", headerName: "Комментарий", flex: 2 },
];

const AttributesTable: React.FC<AttributesTableProps> = ({ attributes }) => {
	if (!attributes || attributes.length === 0) return null;

	return (
		<Box sx={{ height: 222, width: "100%" }}>
			<DataGrid
				hideFooterPagination
				density="compact"
				rows={attributes}
				columns={columnDefs}
			/>
		</Box>
	);
};

const MappingItem = memo<{
	mapping: DataLineageMapping;
	entities: DataLineageEntity[];
}>(({ mapping, entities }) => {
	const targetEntity = useMemo(() => {
		return entities.find((e) => e.id === mapping.entityId);
	}, [entities, mapping.entityId]);

	const mappingData = useMemo(() => {
		return (
			mapping.deps
				?.flatMap((dep) => dep.attrMaps || [])
				.map((item, index) => ({
					id: `${item.src}-${item.dst}-${index}`,
					src: item.src,
					dst: item.dst,
				})) || []
		);
	}, [mapping.deps]);

	const dependencyData = useMemo(() => {
		return (
			mapping.deps?.flatMap(
				(dep, depIndex) =>
					dep.atrDeps?.map((atrDep, atrIndex) => ({
						id: `${dep.entityId}-${atrDep.attr}-${depIndex}-${atrIndex}`,
						sourceEntity:
							entities.find((e) => e.id === dep.entityId)?.name || dep.entityId,
						sourceAttribute: atrDep.attr,
						linkTypes: atrDep.linkTypes?.join(", ") || "",
					})) || [],
			) || []
		);
	}, [mapping.deps, entities]);

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
					<>
						<Typography variant="subtitle2" gutterBottom>
							Маппинги атрибутов:
						</Typography>
						<Box sx={{ height: 222, width: "100%", mb: 2 }}>
							<DataGrid
								hideFooterPagination
								density="compact"
								rows={mappingData}
								columns={mappingColumnDefs}
								checkboxSelection
								disableRowSelectionOnClick
							/>
						</Box>
					</>
				)}

				{dependencyData.length > 0 && (
					<Box sx={{ mt: 2 }}>
						<Typography variant="subtitle2" gutterBottom>
							Зависимости атрибутов:
						</Typography>
						<Box sx={{ height: 222, width: "100%" }}>
							<DataGrid
								hideFooterPagination
								density="compact"
								rows={dependencyData}
								columns={[
									{
										field: "sourceEntity",
										headerName: "Исходная сущность",
										flex: 1,
									},
									{
										field: "sourceAttribute",
										headerName: "Исходный атрибут",
										flex: 1,
									},
									{ field: "linkTypes", headerName: "Типы связей", flex: 1 },
								]}
								checkboxSelection
								disableRowSelectionOnClick
							/>
						</Box>
					</Box>
				)}
			</AccordionDetails>
		</Accordion>
	);
});

const VirtualizedMappings = memo<{
	mappings: DataLineageMapping[];
	entities: DataLineageEntity[];
}>(({ mappings, entities }) => {
	const renderMapping = useCallback(
		({ index, style }: { index: number; style: React.CSSProperties }) => (
			<div
				key={`virtualized-mapping-${mappings[index]?.id || "unknown"}-${index}`}
				style={style}
			>
				<MappingItem mapping={mappings[index]} entities={entities} />
			</div>
		),
		[mappings, entities],
	);

	if (!mappings || mappings.length === 0) {
		return (
			<Typography variant="body2" color="text.secondary">
				Нет доступных маппингов
			</Typography>
		);
	}

	if (mappings.length <= 5000) {
		return (
			<Box sx={{ width: "100%" }}>
				{mappings.map((mapping, index) => (
					<Box
						key={`mapping-${mapping.id || "unknown"}-${index}`}
						sx={{ mb: 1 }}
					>
						<MappingItem mapping={mapping} entities={entities} />
					</Box>
				))}
			</Box>
		);
	}

	return (
		<Box>
			<List
				height={600}
				itemCount={mappings.length}
				itemSize={300}
				width="100%"
			>
				{renderMapping}
			</List>
		</Box>
	);
});

const EntitiesTable = memo<EntitiesTableProps>(({ entities, showType }) => {
	const [searchTerm, setSearchTerm] = useState("");

	const columnDefs = useMemo<GridColDef[]>(
		() => [
			{ field: "originalId", headerName: "ID", flex: 1 },
			{
				field: "name",
				headerName: "Название",
				flex: 1,
				renderCell: (params) => {
					return (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<span>{params.value}</span>
							{params.row.modified && (
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
							renderCell: (params: any) => (
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
				renderCell: (params) => params.value?.length || 0,
			},
		],
		[showType],
	);

	const filteredEntities = useMemo(() => {
		if (!entities) return [];
		if (!searchTerm) return entities;
		return entities.filter(
			(entity) =>
				entity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				entity.namespace?.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [entities, searchTerm]);

	const _gridOptions = useMemo(
		() => ({
			animateRows: false,
			suppressRowHoverHighlight: true,
			suppressMovableColumns: true,
			enableCellTextSelection: false,
			rowBuffer: 10,
			suppressRowVirtualisation: false,
			maxBlocksInCache: 5,
		}),
		[],
	);

	const handleSearchChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setSearchTerm(event.target.value);
		},
		[],
	);

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
				<DataGrid
					hideFooter
					density="compact"
					rows={filteredEntities.map((entity, index) => ({
						...entity,
						id: `${entity.id}-${index}`,
						originalId: entity.id,
					}))}
					columns={columnDefs}
					checkboxSelection
					disableRowSelectionOnClick
				/>
			</Box>
		</Box>
	);
});

const DataMart2 = memo(() => {
	const [activeTab, setActiveTab] = useState(0);
	const { currentGraph } = useDataLineageStore();

	const { dataMarts, sourceEntities, mappings, entities } = useMemo(() => {
		if (!currentGraph?.entities) {
			return {
				dataMarts: [],
				sourceEntities: [],
				mappings: [],
				entities: [],
			};
		}

		return {
			dataMarts: currentGraph.entities.filter((e) => e.modified),
			sourceEntities: currentGraph.entities.filter((e) => !e.modified),
			mappings: currentGraph.mappings || [],
			entities: currentGraph.entities,
		};
	}, [currentGraph]);

	const handleTabChange = useCallback(
		(_: React.SyntheticEvent, newValue: number) => {
			setActiveTab(newValue);
		},
		[],
	);

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
});

export { DataMart2 };
