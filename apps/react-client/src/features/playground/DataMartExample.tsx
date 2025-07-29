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
	Alert,
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableRow,
	Paper,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";

const data = {
	desc: {
		appId: "spark-application-123",
		appName: "Data Mart ETL Job",
	},
	entities: [
		{
			id: "source_table_1",
			modified: false,
			type: "table",
			namespace: "sales",
			name: "transactions",
			attrSeq: [
				{
					name: "transaction_id",
					type: "bigint",
					comment: "Unique transaction identifier",
				},
				{
					name: "customer_id",
					type: "bigint",
					comment: "Customer reference",
				},
				{
					name: "amount",
					type: "decimal(18,2)",
					comment: "Transaction amount",
				},
			],
		},
		{
			id: "source_table_2",
			modified: false,
			type: "table",
			namespace: "customers",
			name: "customer_info",
			attrSeq: [
				{
					name: "customer_id",
					type: "bigint",
					comment: "Primary key",
				},
				{
					name: "customer_name",
					type: "varchar(100)",
					comment: "Customer full name",
				},
			],
		},
		{
			id: "target_datamart",
			modified: true,
			type: "table",
			namespace: "dwh",
			name: "sales_datamart",
			attrSeq: [
				{
					name: "transaction_id",
					type: "bigint",
					comment: "Transaction reference",
				},
				{
					name: "customer_id",
					type: "bigint",
					comment: "Customer reference",
				},
				{
					name: "customer_name",
					type: "varchar(100)",
					comment: "Customer full name",
				},
				{
					name: "transaction_amount",
					type: "decimal(18,2)",
					comment: "Amount in USD",
				},
			],
		},
	],
	mappings: [
		{
			id: 1,
			entityId: "target_datamart",
			deps: [
				{
					entityId: "source_table_1",
					attrMaps: [
						{
							src: "transaction_id",
							dst: "transaction_id",
						},
						{
							src: "customer_id",
							dst: "customer_id",
						},
						{
							src: "amount",
							dst: "transaction_amount",
						},
					],
					atrDeps: [
						{
							attr: "customer_id",
							linktypes: ["join"],
						},
						{
							attr: "amount",
							linktypes: ["window"],
						},
					],
				},
				{
					entityId: "source_table_2",
					attrMaps: [
						{
							src: "customer_id",
							dst: "customer_id",
						},
						{
							src: "customer_name",
							dst: "customer_name",
						},
					],
					atrDeps: [
						{
							attr: "customer_id",
							linktypes: ["join"],
						},
					],
				},
			],
			unmatched: [],
		},
	],
};

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
	linktypes?: LinkType[];
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

type LineageVisualizationProps = {
	entities: Entity[];
	mappings: Mapping[];
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
		{ field: "name", headerName: "Name", flex: 1 },
		{ field: "type", headerName: "Type", flex: 1 },
		{ field: "comment", headerName: "Comment", flex: 2 },
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
			{mappings.map((mapping) => {
				const targetEntity = entities.find((e) => e.id === mapping.entityId);
				return (
					<Accordion key={mapping.id}>
						<AccordionSummary expandIcon={<ExpandMore />}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Typography>Mapping #{mapping.id} →</Typography>
								<Chip label="DATA MART" color="error" size="small" />
								<Typography>
									{targetEntity?.name || mapping.entityId}
								</Typography>
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<Box sx={{ mb: 2 }}>
								<Typography variant="h6" gutterBottom>
									Target: {targetEntity?.name || mapping.entityId}
								</Typography>
								<AttributesTable attributes={targetEntity?.attrSeq} />
							</Box>

							{mapping.deps.map((dep, idx) => {
								const sourceEntity = entities.find(
									(e) => e.id === dep.entityId,
								);
								const mappingColumnDefs: ColDef[] = [
									{ field: "src", headerName: "Source", flex: 1 },
									{ field: "dst", headerName: "Target", flex: 1 },
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
											Source: {sourceEntity?.name || dep.entityId}
										</Typography>
										<AttributesTable attributes={sourceEntity?.attrSeq} />

										<Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
											Attribute Mappings
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
													Attribute Dependencies
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
														{attrDep.linktypes?.map((type, j) => (
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
			headerName: "Name",
			flex: 1,
			cellRenderer: (params: any) => (
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<span>{params.value}</span>
					{params.data.modified && (
						<Chip label="DATA MART" color="error" size="small" />
					)}
				</Box>
			),
		},
		...(showType
			? [
					{
						field: "type",
						headerName: "Type",
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
		{ field: "namespace", headerName: "Namespace", flex: 1 },
		{
			field: "attrSeq",
			headerName: "Attributes",
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

const LineageVisualization: React.FC<LineageVisualizationProps> = ({
	entities,
	mappings,
}) => {
	return (
		<Box>
			<Alert severity="info" sx={{ mb: 2 }}>
				<Typography variant="h6">Lineage Visualization</Typography>
				<Typography variant="body2">
					This would display a graph showing relationships between sources and
					data marts based on the mappings.
				</Typography>
			</Alert>
			<Paper
				sx={{
					height: 400,
					border: "1px dashed",
					borderColor: "grey.300",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgColor: "grey.50",
				}}
			>
				<Typography variant="body1" color="text.secondary">
					Graph visualization would be implemented here
				</Typography>
			</Paper>
		</Box>
	);
};

const DataMartLineageUI: React.FC<{ data?: DataMartLineageData }> = () => {
	const [activeTab, setActiveTab] = useState(0);

	const dataMarts = data.entities.filter((e) => e.modified);
	const sourceEntities = data.entities.filter((e) => !e.modified);

	return (
		<Box sx={{ p: 2 }}>
			<Card sx={{ mb: 2 }}>
				<CardHeader title="Spark Application Info" />
				<CardContent>
					<TableContainer component={Paper} variant="outlined">
						<Table size="small">
							<TableBody>
								<TableRow>
									<TableCell
										component="th"
										scope="row"
										sx={{ fontWeight: "bold" }}
									>
										Application ID
									</TableCell>
									<TableCell>{data.desc.appId}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell
										component="th"
										scope="row"
										sx={{ fontWeight: "bold" }}
									>
										Application Name
									</TableCell>
									<TableCell>{data.desc.appName}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell
										component="th"
										scope="row"
										sx={{ fontWeight: "bold" }}
									>
										DataMarts
									</TableCell>
									<TableCell>
										<Chip label={dataMarts.length} color="error" size="small" />
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell
										component="th"
										scope="row"
										sx={{ fontWeight: "bold" }}
									>
										Sources
									</TableCell>
									<TableCell>
										<Chip
											label={sourceEntities.length}
											color="success"
											size="small"
										/>
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</CardContent>
			</Card>

			{dataMarts.length > 0 && (
				<Card sx={{ mb: 2 }} variant="outlined">
					<CardHeader
						title={
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Chip label="DATA MARTS" color="error" size="small" />
								<Typography variant="h6">Target Entities</Typography>
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
					<Tab label="Data Lineage" />
					<Tab label="Source Entities" />
					<Tab label="Mappings" />
				</Tabs>
			</Box>

			<Box sx={{ mt: 2 }}>
				{activeTab === 0 && (
					<LineageVisualization
						entities={data.entities as any}
						mappings={data.mappings as any}
					/>
				)}
				{activeTab === 1 && (
					<EntitiesTable entities={sourceEntities as any} showType={true} />
				)}
				{activeTab === 2 && (
					<MappingsAccordion
						mappings={data?.mappings as any}
						entities={data.entities as any}
					/>
				)}
			</Box>
		</Box>
	);
};

export { DataMartLineageUI };
