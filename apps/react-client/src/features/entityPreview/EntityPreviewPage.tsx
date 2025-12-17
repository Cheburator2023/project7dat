import React, { useState, useCallback, useMemo } from "react";
import { Layout, Model, TabNode, Action } from "flexlayout-react";

import {
	CircularProgress,
	styled,
	Box,
	Alert,
	Typography,
	Chip,
} from "@mui/material";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { usePanelSettingsStore } from "@react-client/common/store/panelSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { EntityJsonEditor } from "./components/EntityJsonEditor";
import { EntityNodeView } from "./components/EntityNodeView";
import { EntityDetailsView } from "./components/EntityDetailsView";
import { useParams, useSearchParams } from "react-router-dom";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";
import { Flex } from "@react-client/common/primitives/Flex";
import type { DataLineageEntity } from "@react-client/types/dataLineage";
import { Card } from "@react-client/common/muiCustom/Card";

import {
	Storage as StorageIcon,
	HelpOutline as HelpOutlineIcon,
	TableChart as TableChartIcon,
	ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import {EntityBadges} from "@react-client/features/dashboard/atoms";

const TYPE_ICONS: Record<string, React.ReactNode> = {
	table: <TableChartIcon fontSize={"large"} />,
	view: <ViewModuleIcon fontSize={"large"} />,
	rdd: <StorageIcon fontSize={"large"} />,
	unresolved: <HelpOutlineIcon fontSize={"large"} />,
};

const TYPE_LABELS: Record<string, string> = {
	table: "Таблица",
	view: "Представление",
	rdd: "RDD",
	unresolved: "Неизвестно",
};

const flexLayoutJson = {
	global: {
		tabEnableClose: false,
		tabEnableRename: false,
		tabSetEnableTabStrip: true,
		tabSetEnableDrop: true,
		tabSetEnableDrag: true,
		tabSetEnableClose: false,
		tabSetEnableMaximize: true,
	},
	borders: [],
	layout: {
		type: "row",
		weight: 100,
		children: [
			{
				type: "tabset",
				weight: 50,
				children: [
					{
						type: "tab",
						name: "Граф",
						component: "entity-node",
						id: "entity-node-tab",
					},
				],
			},
			{
				type: "tabset",
				weight: 30,
				children: [
					{
						type: "tab",
						name: "Детали",
						component: "entity-details",
						id: "entity-details-tab",
					},
				],
			},
			{
				type: "tabset",
				weight: 20,
				children: [
					{
						type: "tab",
						name: "JSON",
						component: "entity-json",
						id: "entity-json-tab",
					},
				],
			},
		],
	},
};

interface EntityPreviewPageProps {
	entityId?: string;
}

export const EntityPreviewPage: React.FC<EntityPreviewPageProps> = ({
	entityId: propEntityId,
}) => {
	const [currentEntityId, setCurrentEntityId] = useState()
	const { isPending } = useCurrentDataLineageGraph();
	const [calculatedEntities, setCalculatedEntities] = useState<
		DataLineageEntity[]
	>([]);

	const isPersistEnabled = usePanelSettingsStore((state) =>
		state.isPanelPersistEnabled("entity-preview"),
	);

	const { entityId: urlEntityId } = useParams<{ entityId: string }>();
	const [searchParams, setSearchParams] = useSearchParams();

	// Get highlighted attribute from URL
	const highlightedAttr = searchParams.get("highlightAttr");

	// Clear highlight after some time or on user action
	const handleClearHighlight = useCallback(() => {
		setSearchParams((prev) => {
			prev.delete("highlightAttr");
			return prev;
		});
	}, [setSearchParams]);
	const [model, _setModel] = useState(() => {
		const { isPanelPersistEnabled } = usePanelSettingsStore.getState();
		if (isPanelPersistEnabled("entity-preview")) {
			try {
				const savedLayout = localStorage.getItem("entity-preview-layout");
				if (savedLayout) {
					return Model.fromJson(JSON.parse(savedLayout));
				}
			} catch (error) {
				console.warn("Failed to load layout from localStorage:", error);
			}
		}
		return Model.fromJson(flexLayoutJson);
	});

	const { currentGraph } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
		})),
	);

	const selectedEntity = useMemo(() => {
		if (!currentGraph?.entities) return null;

		// Decode the URL entity ID to handle encoded slashes and special characters
		const decodedUrlEntityId = urlEntityId
			? decodeURIComponent(urlEntityId)
			: undefined;

		const targetEntityId = currentEntityId || propEntityId || decodedUrlEntityId;

		if (targetEntityId) {
			console.log(currentGraph.entities.find((e) => e.id === targetEntityId) || null)
			return currentGraph.entities.find((e) => e.id === targetEntityId) || null;
		}

		// For now, let's select the first entity as an example if no entityId is provided
		return currentGraph.entities.length > 0 ? currentGraph.entities[0] : null;
	}, [currentGraph?.entities, propEntityId, urlEntityId,currentEntityId]);

	const relatedMappings = useMemo(() => {
		const decodedUrlEntityId = urlEntityId
			? decodeURIComponent(urlEntityId)
			: undefined;
		const targetEntityId = propEntityId || decodedUrlEntityId;
		if (!currentGraph?.mappings || !targetEntityId) return [];
		return currentGraph.mappings.filter(
			(mapping) =>
				mapping.entityId === targetEntityId ||
				mapping.deps?.some((dep) => dep.entityId === targetEntityId),
		);
	}, [currentGraph?.mappings, propEntityId, urlEntityId]);

	const onSelectNode = useCallback((data: any) => setCurrentEntityId(data),[]);

	const factory = useCallback(
		(node: TabNode) => {
			const component = node.getComponent();

			switch (component) {
				case "entity-node":
					return (
						<EntityContainer>
							<EntityNodeView
								entity={selectedEntity}
								mappings={relatedMappings}
								onEntitiesCalculated={setCalculatedEntities}
								highlightedAttr={highlightedAttr}
								onSelectNode={onSelectNode}
							/>
						</EntityContainer>
					);
				case "entity-details":
					return (
						<EntityContainer>
							<EntityDetailsView
								entity={selectedEntity}
								mappings={relatedMappings}
								allEntities={calculatedEntities}
							/>
						</EntityContainer>
					);
				case "entity-json":
					return (
						<EntityContainer>
							<EntityJsonEditor entity={selectedEntity} />
						</EntityContainer>
					);
				default:
					return <div>Unknown component: {component}</div>;
			}
		},
		[selectedEntity, relatedMappings, calculatedEntities],
	);

	const onAction = useCallback(
		(action: Action) => {
			const result = action;

			if (isPersistEnabled) {
				setTimeout(() => {
					try {
						const layoutJson = model.toJson();
						localStorage.setItem(
							"entity-preview-layout",
							JSON.stringify(layoutJson),
						);
					} catch (error) {
						console.warn("Failed to save layout to localStorage:", error);
					}
				}, 0);
			}

			return result;
		},
		[model, isPersistEnabled],
	);

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

	if (!selectedEntity) {
		return (
			<div>
				<Header>{/* <div>Сущность не найдена</div> */}</Header>
				<Wrapper>
					<div style={{ padding: "20px", textAlign: "center" }}>
						Сущность с ID "
						{propEntityId ||
							(urlEntityId ? decodeURIComponent(urlEntityId) : "")}
						" не найдена в текущем графе.
					</div>
				</Wrapper>
			</div>
		);
	}

	return (
		<div>
			<Header>
				{highlightedAttr && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
						<Alert
							severity="info"
							sx={{ py: 0, px: 1 }}
							onClose={handleClearHighlight}
						>
							Выделен атрибут: <strong>{highlightedAttr}</strong>
						</Alert>
					</Box>
				)}
			</Header>
			<>
				<div
					style={{
						padding: "0 0px",
					}}
				>
					<Card
						data-test-id="header--Card-0"
						zoom={0.7}
						uuid="header_uuid"
						style={{ overflow: "visible", padding: "4px" }}
					>
						<Box
							display="flex"
							justifyContent="space-between"
							alignItems="flex-start"
						>
							<Box display="flex" alignItems="center" gap={2}>
								<Box
									sx={{
										bgcolor: "rgba(255,255,255,0.2)",
										borderRadius: 1.5,
										p: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									{TYPE_ICONS[selectedEntity?.type] || (
										<StorageIcon fontSize={"large"} />
									)}
								</Box>
								<Box>
									<Flex
									>
										<Chip
											label={selectedEntity.type}
											size="small"
											color={
												selectedEntity.type === "table"
													? "primary"
													: "secondary"
											}
										/>

										{/*<EntityBadges*/}
										{/*	isDataMart={selectedEntity.isDataMart}*/}
										{/*	isSource={selectedEntity.isSource}*/}
										{/*	modified={selectedEntity.modified}*/}
										{/*/>*/}

									</Flex>
									<Typography variant="h5" fontWeight={600}>
										{selectedEntity.name || entity.id}
									</Typography>
									{selectedEntity.namespace && (
										<Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
											{selectedEntity.namespace}
										</Typography>
									)}
								</Box>
							</Box>
						</Box>
					</Card>
				</div>
			</>
			<Wrapper id="entity_preview_container">
				<FlexLayoutContainer>
					<Layout
						model={model}
						factory={factory}
						onAction={onAction}
						realtimeResize
					/>
				</FlexLayoutContainer>
			</Wrapper>
		</div>
	);
};

const FlexLayoutContainer = styled("div")(({ theme }) => {
	return {
		position: "absolute",
		width: "100%",
		height: "100%",
		left: 0,
		top: 0,
		zIndex: 1,
		pointerEvents: "auto",
		backgroundColor: "transparent",
		color: theme.vars?.palette?.text.primary,
		"& .flexlayout__layout": {
			backgroundColor: "transparent",
		},
		"& .flexlayout__tab": {
			backgroundColor: theme.vars?.palette?.background.paper,
			color: theme.vars?.palette?.text.primary,
			borderColor: theme.vars?.palette?.divider,
			borderRadius: "8px",
		},
		"& .flexlayout__tab_selected": {
			backgroundColor: theme.vars?.palette?.background.default,
			color: theme.vars?.palette?.text.primary,
		},
		"& .flexlayout__tabset-selected": {
			backgroundColor: theme.vars?.palette?.action.selected,
			borderColor: theme.vars?.palette?.primary.main,
		},
		"& .flexlayout__tabset_header": {
			backgroundColor: theme.vars?.palette?.background.paper,
			borderColor: theme.vars?.palette?.divider,
		},
		"& .flexlayout__tab_button": {
			backgroundColor: "transparent",
			color: theme.vars?.palette?.text.secondary,
			border: "none",
			padding: "5px 0",
			"&:hover": {
				backgroundColor: theme.vars?.palette?.action.hover,
				color: theme.vars?.palette?.text.primary,
			},
		},
		"& .flexlayout__tabset_tabbar_outer": {
			backgroundColor: theme.vars?.palette?.background.paper,
			borderBottom: "1px solid rgb(83 83 83 / 30%)",
		},
		"& .flexlayout__tab_button_selected": {
			backgroundColor: theme.vars?.palette?.action.selected,
			color: theme.vars?.palette?.primary.main,
			fontWeight: 600,
		},
		"& .flexlayout__tabset_content": {
			backgroundColor: theme.vars?.palette?.background.default,
		},
		"& .flexlayout__border": {
			backgroundColor: theme.vars?.palette?.background.paper,
			borderColor: theme.vars?.palette?.divider,
		},
		"& .flexlayout__outline_rect": {
			borderColor: theme.vars?.palette?.primary.main,
		},
		"& .flexlayout__tabset": {
			// @ts-expect-error
			fontFamily: theme.vars?.font.inherit,
			borderRadius: "8px",
			border: "1px solid #a5aaba90",
			margin: "4px",
			zoom: 0.8,
			backgroundColor: theme.vars?.palette?.background.paper,
		},
		"& .flexlayout__splitter": {
			backgroundColor: theme.vars?.palette?.divider,
			borderRadius: "8px",
			width: "4px !important",
			minWidth: "4px !important",
		},
		"& .flexlayout__splitter.flexlayout__splitter_vert": {
			backgroundColor: theme.vars?.palette?.divider,
			borderRadius: "8px",
			height: "4px !important",
			minHeight: "4px !important",
			width: "inherit !important",
			minWidth: "inherit !important",
		},
		"& .flexlayout__splitter_vert": {
			margin: "0 6px",
		},
		"& .flexlayout__splitter_horz": {
			margin: "6px 0",
		},
		"& .flexlayout__tab_button_content": {
			padding: "4px 9px",
			borderRadius: "8px",
			backgroundColor: "#488ecb1a",
		},
	};
});

const EntityContainer = styled("div")(
	({ theme }) => `
	height: 100%;
	width: 100%;
	background-color: ${theme.vars?.palette?.background.paper};
	color: ${theme.vars?.palette?.text.primary};
`,
);

const Wrapper = styled("div")(
	({ theme }) => `
	height: calc(100vh - 64px);
	position: relative;
	background-color: transparent;
	color: ${theme.vars?.palette?.text.primary};
`,
);
