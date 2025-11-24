import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { Flex } from "@react-client/common/primitives/Flex";
import {
	Alert,
	Box,
	Breadcrumbs,
	Card,
	CardHeader,
	Chip,
	CircularProgress,
	Link,
	Stack,
	Typography,
	CardContent,
	Tabs,
	Tab,
} from "@mui/material";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";
import { useShallow } from "zustand/react/shallow";
import { Home } from "@mui/icons-material";
import { AttributesTable } from "@react-client/features/dataMart/components/AttributesTable";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { DataLineageGraph } from "@react-client/organisms/DataLineageGraph";
import { DataLineageEntity } from "@react-client/types/dataLineage";

export const DataMartPreview: React.FC = () => {
	const navigate = useNavigate();

	const [activeTab, setActiveTab] = useState(0);
	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const [selectedEntity, setSelectedEntity] =
		useState<DataLineageEntity | null>(null);

	const { isPending } = useCurrentDataLineageGraph();
	const { datamartId } = useParams<{ datamartId: string }>();

	const entitiesId = useMemo(() => datamartId?.replace("+", "/"), [datamartId]);

	const { currentGraph } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
		})),
	);

	const dataMart = useMemo(
		() => currentGraph?.entities?.find((e) => e.id === entitiesId),
		[entitiesId, currentGraph, isPending],
	);

	const handleHome = () => {
		navigate("/");
	};

	const mapping = useMemo(() => {
		const depsBuf = [];
		const deps = currentGraph?.mappings?.filter(
			(m) => m?.entityId === entitiesId,
		);

		deps?.forEach((depmap) => {
			depmap.deps.forEach((dep) => {
				const curdep = currentGraph?.entities?.find(
					(entity) => entity.id === dep?.entityId,
				);
				if (curdep) {
					depsBuf.push(curdep);
				}
			});
		});

		console.log(depsBuf);
		return depsBuf;
	}, [currentGraph, entitiesId]);

	const graph = useMemo(() => {
		return {
			...currentGraph,
			entities: [dataMart, ...mapping],
			mappings: currentGraph?.mappings.filter((m) => m.entityId === entitiesId),
			failedMappings: [],
		};
	}, [currentGraph, dataMart]);

	if (isPending) {
		return (
			<Flex
				width="100%"
				height="100%"
				justifyContent="center"
				alignItems="center"
			>
				<CircularProgress />
			</Flex>
		);
	}

	if (!dataMart) {
		return (
			<Box p={4}>
				<Alert severity="error">
					Модель данных с ID "{entitiesId}" не найден
				</Alert>
			</Box>
		);
	}

	return (
		<Box p={3}>
			<Stack spacing={3}>
				<Breadcrumbs aria-label="breadcrumb">
					<Link
						underline="hover"
						color="inherit"
						onClick={handleHome}
						sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
					>
						<Home sx={{ mr: 0.5 }} fontSize="inherit" />
						Главная
					</Link>
					<Typography color="text.primary">{dataMart.namespace}</Typography>
					<Typography color="text.primary">{dataMart.name}</Typography>
				</Breadcrumbs>

				<Card>
					<CardHeader
						title={
							<Stack direction="row" spacing={2} alignItems="center">
								<Typography variant="h5" component="h1">
									{dataMart.name}
								</Typography>
								<Chip
									label={dataMart.type}
									color="primary"
									variant="outlined"
									size="small"
								/>
							</Stack>
						}
						subheader={
							<Stack spacing={1}>
								<Typography variant="body2" color="text.secondary">
									{dataMart.description}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Изменено:{" "}
									{dataMart?.entity_change
										? new Date(dataMart.entity_change).toLocaleDateString(
												"ru-RU",
											)
										: "Отсутсвует"}
								</Typography>
							</Stack>
						}
					/>
				</Card>

				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs value={activeTab} onChange={handleTabChange}>
						<Tab label="Атрибуты" />
						<Tab label="Граф" />
					</Tabs>
				</Box>

				{activeTab === 0 && dataMart && dataMart?.attrSeq && (
					<Card>
						<CardHeader subheader="Детальная информация по атрибутам" />
						<CardContent>
							<AttributesTable
								attributes={
									dataMart?.attrSeq?.map((attr, index) => ({
										id: `${entitiesId}-${attr.name}-${index}`,
										name: attr.name,
										type: attr.type,
										comment: attr.comment,
									})) || []
								}
							/>
						</CardContent>
					</Card>
				)}

				{activeTab === 1 && dataMart && dataMart?.attrSeq && (
					<>
						<Card>
							<CardHeader subheader="Визуализация связей между объектами процесса" />
							<Spacer />
							<CardContent>
								{currentGraph ? (
									<DataLineageGraph
										data={graph as any}
										onNodeSelect={setSelectedEntity}
									/>
								) : (
									<Alert severity="info">
										Данные о линии данных для этого процесса недоступны
									</Alert>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader subheader="Детальная информация по атрибутам" />
							<CardContent>
								<AttributesTable
									attributes={
										selectedEntity?.attrSeq?.map((attr, index) => ({
											id: `${entitiesId}-${attr.name}-${index}`,
											name: attr.name,
											type: attr.type,
											comment: attr.comment,
										})) || []
									}
								/>
							</CardContent>
						</Card>
					</>
				)}
			</Stack>
		</Box>
	);
};
