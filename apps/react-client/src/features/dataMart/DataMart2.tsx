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
	Pagination,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { FixedSizeList as List } from "react-window";
import { useDataLineageStore } from "../../stores/dataLineageStore";
import type {
	DataLineageEntity,
	DataLineageMapping,
	DataLineageAttribute,
} from "../../types/dataLineage";

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

	const columnDefs: ColDef[] = [
		{ field: "name", headerName: "Название", flex: 1 },
		{ field: "type", headerName: "Тип", flex: 1 },
		{ field: "comment", headerName: "Комментарий", flex: 2 },
	];

	return (
		<Box sx={{ height: 200, width: "100%" }}>
			<AgGridReact
				rowData={attributes}
				columnDefs={columnDefs}
				domLayout="autoHeight"
				headerHeight={35}
				rowHeight={30}
				suppressMenuHide
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

	const mappingColumnDefs = useMemo<ColDef[]>(
		() => [
			{ field: "src", headerName: "Исходный атрибут", flex: 1 },
			{ field: "dst", headerName: "Целевой атрибут", flex: 1 },
		],
		[],
	);

	const mappingData = useMemo(() => {
		return mapping.deps?.flatMap((dep) => dep.attrMaps || []) || [];
	}, [mapping.deps]);

	const dependencyData = useMemo(() => {
		return (
			mapping.deps?.flatMap(
				(dep) =>
					dep.atrDeps?.map((atrDep) => ({
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
					<AttributesTable attributes={targetEntity?.attrSeq || []} />
				</Box>

				{mappingData.length > 0 && (
					<>
						<Typography variant="subtitle2" gutterBottom>
							Маппинги атрибутов:
						</Typography>
						<Box sx={{ height: 200, width: "100%", mb: 2 }}>
							<AgGridReact
								rowData={mappingData}
								columnDefs={mappingColumnDefs}
								domLayout="autoHeight"
								headerHeight={35}
								rowHeight={30}
								suppressMenuHide
							/>
						</Box>
					</>
				)}

				{dependencyData.length > 0 && (
					<Box sx={{ mt: 2 }}>
						<Typography variant="subtitle2" gutterBottom>
							Зависимости атрибутов:
						</Typography>
						<Box sx={{ height: 150, width: "100%" }}>
							<AgGridReact
								rowData={dependencyData}
								columnDefs={[
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
								domLayout="autoHeight"
								headerHeight={35}
								rowHeight={30}
								suppressMenuHide
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
			<div style={style}>
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

	if (mappings.length <= 5) {
		return (
			<Box sx={{ width: "100%" }}>
				{mappings.map((mapping, index) => (
					<Box key={mapping.id || index} sx={{ mb: 1 }}>
						<MappingItem mapping={mapping} entities={entities} />
					</Box>
				))}
			</Box>
		);
	}

	return (
		<Box sx={{ height: 600, width: "100%" }}>
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
	const [page, setPage] = useState(1);
	const pageSize = 50;

	const columnDefs = useMemo<ColDef[]>(
		() => [
			{ field: "id", headerName: "ID", flex: 1 },
			{
				field: "name",
				headerName: "Название",
				flex: 1,
				cellRenderer: (params: any) => (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<span>{params.value}</span>
						{params.data.modified && (
							<Chip label="ВИТРИНА ДАННЫХ" color="error" size="small" />
						)}
					</Box>
				),
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

	const paginatedEntities = useMemo(() => {
		const start = (page - 1) * pageSize;
		return filteredEntities.slice(start, start + pageSize);
	}, [filteredEntities, page, pageSize]);

	const totalPages = Math.ceil(filteredEntities.length / pageSize);

	const gridOptions = useMemo(
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
			setPage(1);
		},
		[],
	);

	const handlePageChange = useCallback(
		(_: React.ChangeEvent<unknown>, value: number) => {
			setPage(value);
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
			<Box
				sx={{
					height: entities && entities.length > pageSize ? 400 : "auto",
					width: "100%",
				}}
			>
				<AgGridReact
					rowData={paginatedEntities}
					columnDefs={columnDefs}
					domLayout={
						entities && entities.length > pageSize ? "normal" : "autoHeight"
					}
					headerHeight={40}
					rowHeight={35}
					suppressMenuHide
					{...gridOptions}
				/>
			</Box>
			{totalPages > 1 && (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
					<Pagination
						count={totalPages}
						page={page}
						onChange={handlePageChange}
						color="primary"
					/>
				</Box>
			)}
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
		<Box sx={{ p: 2 }}>
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
