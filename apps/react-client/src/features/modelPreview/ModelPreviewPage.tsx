import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Layout, Model, TabNode, Action } from "flexlayout-react";

import {
	styled,
	Box,
	Alert,
	Chip,
	TextField,
	InputAdornment,
} from "@mui/material";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { usePanelSettingsStore } from "@react-client/common/store/panelSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { EntityJsonEditor } from "./components/EntityJsonEditor";
import { EntityDetailsView } from "./components/EntityDetailsView";
import { useParams, useSearchParams } from "react-router-dom";
import { Flex } from "@react-client/common/primitives/Flex";
import type { DataLineageEntity } from "@react-client/types/dataLineage";

import {
	Storage as StorageIcon,
	HelpOutline as HelpOutlineIcon,
	TableChart as TableChartIcon,
	ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import { ModelGraphPanel } from "@react-client/features/modelPreview/organisms/ModelGraphPanel";
import { SearchIcon } from "lucide-react";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";
import { useEntitiesStore } from "@react-client/features/entities/stores";

const TYPE_ICONS: Record<string, React.ReactNode> = {
	table: <TableChartIcon fontSize={"large"} />,
	view: <ViewModuleIcon fontSize={"large"} />,
	rdd: <StorageIcon fontSize={"large"} />,
	unresolved: <HelpOutlineIcon fontSize={"large"} />,
};

const _TYPE_LABELS: Record<string, string> = {
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
			// {
			// 	type: "tabset",
			// 	weight: 50,
			// 	children: [
			// 		{
			// 			type: "tab",
			// 			name: "Граф",
			// 			component: "entity-node",
			// 			id: "entity-node-tab",
			// 		},
			// 	],
			// },
			{
				type: "tabset",
				weight: 50,
				children: [
					{
						type: "tab",
						name: "Детали",
						component: "entity-details",
						id: "entity-details-tab",
					},
					{
						type: "tab",
						name: "Граф",
						component: "entity-graph",
						id: "entity-graph-tab",
					},
				],
			},
			// {
			// 	type: "tabset",
			// 	weight: 30,
			// 	children: [
			//
			// 	],
			// },
			// {
			// 	type: "tabset",
			// 	weight: 20,
			// 	children: [
			// 		{
			// 			type: "tab",
			// 			name: "JSON",
			// 			component: "entity-json",
			// 			id: "entity-json-tab",
			// 		},
			// 	],
			// },
		],
	},
};

interface EntityPreviewPageProps {
	entityId?: string;
}

// Stable selectors for useEntitiesStore
const selectGlobalAttributeSearchQuery = (state: {
	globalAttributeSearchQuery: string;
}) => state.globalAttributeSearchQuery;

const selectSetGlobalAttributeSearch = (state: {
	setGlobalAttributeSearch: (query: string) => void;
}) => state.setGlobalAttributeSearch;

export const ModelPreviewPage: React.FC<EntityPreviewPageProps> = ({
	entityId: propEntityId,
}) => {
	const [currentEntityId, setCurrentEntityId] = useState();
	const [calculatedEntities, _setCalculatedEntities] = useState<
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

	// Global attribute search
	const globalAttributeSearchQuery = useEntitiesStore(
		selectGlobalAttributeSearchQuery,
	);
	const setGlobalAttributeSearch = useEntitiesStore(
		selectSetGlobalAttributeSearch,
	);

	const [attributeSearchInputValue, setAttributeSearchInputValue] = useState(
		globalAttributeSearchQuery,
	);

	useEffect(() => {
		setAttributeSearchInputValue(globalAttributeSearchQuery);
	}, [globalAttributeSearchQuery]);

	useEffect(() => {
		const handle = window.setTimeout(() => {
			if (attributeSearchInputValue !== globalAttributeSearchQuery) {
				setGlobalAttributeSearch(attributeSearchInputValue);
			}
		}, 300);
		return () => window.clearTimeout(handle);
	}, [
		attributeSearchInputValue,
		globalAttributeSearchQuery,
		setGlobalAttributeSearch,
	]);

	const handleAttributeSearchChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setAttributeSearchInputValue(event.target.value);
		},
		[],
	);

	const [model, _setModel] = useState(() => {
		const { isPanelPersistEnabled } = usePanelSettingsStore.getState();
		if (isPanelPersistEnabled("model-preview")) {
			try {
				const savedLayout = localStorage.getItem("model-preview-layout");
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

		const targetEntityId = decodedUrlEntityId;

		if (targetEntityId) {
			console.log(
				currentGraph.entities.find((e) => e.id === targetEntityId) || null,
			);
			return currentGraph.entities.find((e) => e.id === targetEntityId) || null;
		}

		// For now, let's select the first entity as an example if no entityId is provided
		return currentGraph.entities.length > 0 ? currentGraph.entities[0] : null;
	}, [currentGraph?.entities, propEntityId, urlEntityId, currentEntityId]);

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

	const onSelectNode = useCallback((data: any) => setCurrentEntityId(data), []);

	const factory = useCallback(
		(node: TabNode) => {
			const component = node.getComponent();

			switch (component) {
				// case "entity-node":
				// 	return (
				// 		<EntityContainer>
				// 			<EntityNodeView
				// 				entity={selectedEntity}
				// 				mappings={relatedMappings}
				// 				onEntitiesCalculated={setCalculatedEntities}
				// 				highlightedAttr={highlightedAttr}
				// 				onSelectNode={onSelectNode}
				// 			/>
				// 		</EntityContainer>
				// 	);
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
				case "entity-graph":
					return (
						<ModelGraphPanel
							onSelectNode={onSelectNode}
							entity={selectedEntity}
						/>
					);
				default:
					return <div>Unknown component: {component}</div>;
			}
		},
		[selectedEntity, relatedMappings, calculatedEntities],
	);

	useCurrentDataLineageGraph({ enabled: !currentGraph?.entities });

	const onAction = useCallback(
		(action: Action) => {
			const result = action;

			if (isPersistEnabled) {
				setTimeout(() => {
					try {
						const layoutJson = model.toJson();
						localStorage.setItem(
							"model-preview-layout",
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
			<Header
				title={
					<Flex gap={10}>
						{selectedEntity.namespace}

						<Chip label="model" size="small" color="secondary" />
					</Flex>
				}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: 2 }}>
					<TextField
						size="small"
						placeholder="Поиск по атрибутам (мин. 3 символа)..."
						value={attributeSearchInputValue}
						onChange={handleAttributeSearchChange}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon fontSize="small" />
								</InputAdornment>
							),
						}}
						sx={{
							minWidth: 350,
							bgcolor: "background.paper",
							borderRadius: 1,
						}}
					/>
					{highlightedAttr && (
						<Alert
							severity="info"
							sx={{ py: 0, px: 1 }}
							onClose={handleClearHighlight}
						>
							Выделен атрибут: <strong>{highlightedAttr}</strong>
						</Alert>
					)}
				</Box>
			</Header>

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
			margin: "0 2px",
		},
		"& .flexlayout__splitter_horz": {
			margin: "2px 0",
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
