import React, { useState } from "react";
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
	Paper,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";

// Типы данных
type Attribute = {
	name: string;
	type: string;
	comment?: string;
};

type EntityType = "table" | "view";

type Entity = {
	id: string;
	modified: boolean; // true для DataMart
	type: EntityType;
	namespace: string;
	name: string;
	attrSeq: Attribute[];
};

type AttributeMapping = {
	src: string;
	dst: string;
};

type LinkType = "window" | "join" | "where" | "groupby";

type AttributeDependency = {
	attr: string;
	linkTypes?: LinkType[];
};

type Dependency = {
	entityId: string;
	attrMaps?: AttributeMapping[];
	atrDeps?: AttributeDependency[];
};

type Mapping = {
	id: number;
	entityId: string; // ID DataMart (таргета)
	deps: Dependency[];
	unmatched?: any[];
};

type AppDescription = {
	appId: string;
	appName: string;
};

type DataMartLineageData = {
	desc: AppDescription;
	entities: Entity[];
	mappings: Mapping[];
};

// Пропсы для дочерних компонентов
type EntitiesTableProps = {
	entities: Entity[];
	showType: boolean;
};

type MappingsAccordionProps = {
	mappings: Mapping[];
	entities: Entity[];
};

type AttributesTableProps = {
	attributes?: Attribute[];
};

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

const MappingsAccordion: React.FC<MappingsAccordionProps> = ({
	mappings,
	entities,
}) => {
	return (
		<Box>
			{mappings?.map((mapping) => {
				const targetEntity = entities.find((e) => e.id === mapping.entityId);
				return (
					<Accordion key={mapping.id}>
						<AccordionSummary expandIcon={<ExpandMore />}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Typography>Маппинг #{mapping.id} →</Typography>
								<Chip label="ВИТРИНА ДАННЫХ" color="error" size="small" />
								<Typography>
									{targetEntity?.name || mapping.entityId}
								</Typography>
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<Box sx={{ mb: 2 }}>
								<Typography variant="h6" gutterBottom>
									Цель: {targetEntity?.name || mapping.entityId}
								</Typography>
								<AttributesTable attributes={targetEntity?.attrSeq} />
							</Box>

							{mapping.deps.map((dep, idx) => {
								const sourceEntity = entities.find(
									(e) => e.id === dep.entityId,
								);
								const mappingColumnDefs: ColDef[] = [
									{ field: "src", headerName: "Источник", flex: 1 },
									{ field: "dst", headerName: "Цель", flex: 1 },
								];

								return (
									<Paper
										key={idx}
										sx={{
											mb: 2,
											p: 2,
											bgColor: "grey.50",
										}}
									>
										<Typography variant="h6" gutterBottom>
											Источник: {sourceEntity?.name || dep.entityId}
										</Typography>
										<AttributesTable attributes={sourceEntity?.attrSeq} />

										<Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
											Маппинг атрибутов
										</Typography>
										<Box sx={{ height: 150, width: "100%" }}>
											<AgGridReact
												rowData={dep.attrMaps}
												columnDefs={mappingColumnDefs}
												domLayout="autoHeight"
												headerHeight={35}
												rowHeight={30}
												suppressMenuHide
											/>
										</Box>

										{dep.atrDeps && dep.atrDeps.length > 0 && (
											<Box sx={{ mt: 2 }}>
												<Typography variant="h6" gutterBottom>
													Зависимости атрибутов
												</Typography>
												{dep.atrDeps.map((attrDep, i) => (
													<Box
														key={i}
														sx={{
															mb: 1,
															display: "flex",
															alignItems: "center",
															gap: 1,
														}}
													>
														<Typography variant="body2" fontWeight="bold">
															{attrDep.attr}:
														</Typography>
														{attrDep.linkTypes?.map((type, j) => (
															<Chip
																key={j}
																label={type}
																size="small"
																variant="outlined"
															/>
														))}
													</Box>
												))}
											</Box>
										)}
									</Paper>
								);
							})}
						</AccordionDetails>
					</Accordion>
				);
			})}
		</Box>
	);
};

const EntitiesTable: React.FC<EntitiesTableProps> = ({
	entities,
	showType,
}) => {
	const columnDefs: ColDef[] = [
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
			cellRenderer: (params: any) => params.value.length,
		},
	];

	return (
		<Box sx={{ height: 300, width: "100%" }}>
			<AgGridReact
				rowData={entities}
				columnDefs={columnDefs}
				domLayout="autoHeight"
				headerHeight={40}
				rowHeight={35}
				suppressMenuHide
			/>
		</Box>
	);
};

const DataMart2 = () => {
	const [activeTab, setActiveTab] = useState(0);
	const { currentGraph, selectedNodes, selectNode } = useDataLineageStore();

	const data = currentGraph;

	const dataMarts = data?.entities.filter((e) => e.modified);
	const sourceEntities = data?.entities.filter((e) => !e.modified);

	return (
		<Box sx={{ p: 2 }}>
			{dataMarts && dataMarts.length > 0 && (
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
						<EntitiesTable entities={dataMarts as any} showType={false} />
					</CardContent>
				</Card>
			)}

			<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
				<Tabs
					value={activeTab}
					onChange={(_, newValue) => setActiveTab(newValue)}
				>
					<Tab label="Исходные сущности" />
					<Tab label="Маппинги" />
				</Tabs>
			</Box>

			<Box sx={{ mt: 2 }}>
				{activeTab === 0 && (
					<EntitiesTable entities={sourceEntities as any} showType={true} />
				)}
				{activeTab === 1 && (
					<MappingsAccordion
						mappings={data?.mappings as any}
						entities={data?.entities as any}
					/>
				)}
			</Box>
		</Box>
	);
};

export { DataMart2 };
