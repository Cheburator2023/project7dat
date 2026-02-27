import {
	useState,
	useContext,
	createContext,
	useCallback,
	useMemo,
	useEffect,
	useRef,
	type ChangeEvent,
	type FunctionComponent,
	type ReactNode,
} from "react";

import {
	styled,
	Box,
	Alert,
	TextField,
	InputAdornment,
	useColorScheme,
} from "@mui/material";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { usePanelSettingsStore } from "@react-client/common/stores/panelSettingsStore";
import { useParams, useSearchParams } from "react-router-dom";
import {
	useCurrentDataLineageGraph,
	usePaginatedEntityRelations,
} from "@react-client/api/hooks";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";
import { useEntitiesStore } from "@react-client/features/entities/stores";

import { EntityJsonEditor } from "../components/EntityJsonEditor";
import { EntityDetailsView } from "../components/EntityDetailsView";
import { EntityGraphPanel } from "@react-client/features/entityPreview/organisms/EntityGraphPanel";

import { SkeletonFade } from "@react-client/common/skeleton/atoms/SkeletonFade";
import { SkeletonBlock } from "@react-client/common/skeleton/atoms/SkeletonBlock";
import { SkeletonList } from "@react-client/common/skeleton/molecules/SkeletonList";

import {
	Storage as StorageIcon,
	HelpOutline as HelpOutlineIcon,
	TableChart as TableChartIcon,
	ViewModule as ViewModuleIcon,
	Search as SearchIcon,
} from "@mui/icons-material";
import { DockviewNoCloseTab } from "@react-client/common/dockview/DockviewNoCloseTab";
import { DockviewGroupMaximizeActions } from "@react-client/common/dockview/DockviewGroupMaximizeActions";
import {
	DockviewReadyEvent,
	IDockviewPanelProps,
	Orientation,
	SerializedDockview,
	themeAbyssSpaced,
	themeLightSpaced,
} from "@react-client/features/dockview/core";
import { DockviewReact } from "@react-client/features/dockview/src";

const _TYPE_ICONS: Record<string, ReactNode> = {
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

const dockviewLayoutJson: SerializedDockview = {
	grid: {
		root: {
			type: "branch",
			data: [
				{
					type: "leaf",
					data: {
						id: "group-main",
						activeView: "entity-details-tab",
						views: ["entity-details-tab", "entity-graph-tab"],
					},
				},
			],
			size: 100,
		},
		height: 800,
		width: 1200,
		orientation: Orientation.HORIZONTAL,
	},
	panels: {
		"entity-details-tab": {
			id: "entity-details-tab",
			contentComponent: "entity-details",
			title: "Детали",
		},
		"entity-graph-tab": {
			id: "entity-graph-tab",
			contentComponent: "entity-graph",
			title: "Граф",
		},
	},
	activeGroup: "group-main",
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

type EntityPreviewDockviewContextValue = {
	isLoading: boolean;
	selectedEntity: DataLineageEntity | null;
	relatedMappings: DataLineageMapping[];
	calculatedEntities: DataLineageEntity[];
	graphData:
		| {
				entities: DataLineageEntity[];
				mappings: DataLineageMapping[];
		  }
		| undefined;
	depthLimit: number;
	onDepthChange: (next: number) => void;
	onSelectNode: (data: any) => void;
};

const EntityPreviewDockviewContext =
	createContext<EntityPreviewDockviewContextValue>({
		isLoading: false,
		selectedEntity: null,
		relatedMappings: [],
		calculatedEntities: [],
		graphData: undefined,
		depthLimit: 1,
		onDepthChange: () => undefined,
		onSelectNode: () => undefined,
	});

const useEntityPreviewDockviewContext = () => {
	return useContext(EntityPreviewDockviewContext);
};

const EntityDetailsDockviewPanel: FunctionComponent<
	IDockviewPanelProps
> = () => {
	const { isLoading, selectedEntity, relatedMappings, calculatedEntities } =
		useEntityPreviewDockviewContext();

	return (
		<EntityContainer>
			<SkeletonFade
				loading={isLoading}
				skeleton={<SkeletonList rows={12} rowHeight={16} />}
			>
				<EntityDetailsView
					entity={selectedEntity}
					mappings={relatedMappings}
					allEntities={calculatedEntities}
				/>
			</SkeletonFade>
		</EntityContainer>
	);
};

const EntityJsonDockviewPanel: FunctionComponent<IDockviewPanelProps> = () => {
	const { isLoading, selectedEntity } = useEntityPreviewDockviewContext();

	return (
		<EntityContainer>
			<SkeletonFade
				loading={isLoading}
				skeleton={
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 1,
							minHeight: 0,
						}}
					>
						<SkeletonBlock height={18} width="38%" borderRadius={10} />
						<SkeletonBlock height={14} width="92%" tint="subtle" />
						<SkeletonBlock height={14} width="88%" tint="subtle" />
						<SkeletonBlock height={14} width="74%" tint="subtle" />
						<SkeletonBlock height={14} width="86%" tint="subtle" />
						<SkeletonBlock height={14} width="68%" tint="subtle" />
					</Box>
				}
			>
				<EntityJsonEditor entity={selectedEntity} />
			</SkeletonFade>
		</EntityContainer>
	);
};

const EntityGraphDockviewPanel: FunctionComponent<IDockviewPanelProps> = () => {
	const { isLoading, graphData, depthLimit, onDepthChange, onSelectNode } =
		useEntityPreviewDockviewContext();

	return (
		<EntityGraphPanel
			onSelectNode={onSelectNode}
			isLoading={isLoading}
			graphData={graphData}
			depthLimit={depthLimit}
			onDepthChange={onDepthChange}
		/>
	);
};

export const EntityPreviewPage: FunctionComponent<EntityPreviewPageProps> = ({
	entityId: propEntityId,
}) => {
	const [currentEntityId, setCurrentEntityId] = useState();
	const [depthLimit, setDepthLimit] = useState(1);

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
		(event: ChangeEvent<HTMLInputElement>) => {
			setAttributeSearchInputValue(event.target.value);
		},
		[],
	);
	const storageKey = useMemo(() => {
		const state = usePanelSettingsStore.getState();
		return (
			state.panels.find((p) => p.id === "entity-preview")?.localStorageKey ??
			"entity-preview-dockview-layout"
		);
	}, []);

	// Фоновая загрузка полного графа для GraphPanel
	useCurrentDataLineageGraph({ enabled: false });

	// Определяем целевой entityId
	const targetEntityId = useMemo(() => {
		const decodedUrlEntityId = urlEntityId
			? decodeURIComponent(urlEntityId)
			: undefined;
		return currentEntityId || propEntityId || decodedUrlEntityId || "";
	}, [currentEntityId, propEntityId, urlEntityId]);

	// Загрузка полного графа связей из кэша (без depth — фильтрация на фронте)
	const { data: entityRelationsData, isLoading } = usePaginatedEntityRelations({
		entityId: targetEntityId,
		page: 1,
		limit: 10000,
		enabled: !!targetEntityId,
	});

	// Сущность: только из backend depth-среза
	const selectedEntity = useMemo(() => {
		if (entityRelationsData?.entity) {
			return entityRelationsData.entity as unknown as DataLineageEntity;
		}
		return null;
	}, [entityRelationsData]);

	// Маппинги: только из backend depth-среза
	const relatedMappings = useMemo(() => {
		if (entityRelationsData?.mappings?.length) {
			return entityRelationsData.mappings.map((mapping, index) => ({
				...mapping,
				id: mapping.entity_map_id ?? mapping.target_id ?? index,
			})) as DataLineageMapping[];
		}
		return [];
	}, [entityRelationsData]);

	const graphData = useMemo(() => {
		if (!selectedEntity) return undefined;

		const allEntityIds = new Set<string>([selectedEntity.id]);
		for (const mapping of relatedMappings) {
			allEntityIds.add(mapping.entityId);
			for (const dep of mapping.deps ?? []) {
				allEntityIds.add(dep.entityId);
			}
		}

		const entitiesFromEndpoint = entityRelationsData?.relatedEntities ?? [];

		const entityMap = new Map<string, DataLineageEntity>();
		entityMap.set(selectedEntity.id, selectedEntity);
		for (const entity of entitiesFromEndpoint) {
			entityMap.set(entity.id, entity as DataLineageEntity);
		}

		return {
			entities: Array.from(entityMap.values()),
			mappings: relatedMappings,
		};
	}, [selectedEntity, relatedMappings, entityRelationsData]);

	const calculatedEntities = useMemo(
		() => graphData?.entities ?? [],
		[graphData?.entities],
	);

	const onSelectNode = useCallback((data: any) => setCurrentEntityId(data), []);

	const panelComponents: Record<
		string,
		FunctionComponent<IDockviewPanelProps>
	> = useMemo(
		() => ({
			"entity-details": EntityDetailsDockviewPanel,
			"entity-json": EntityJsonDockviewPanel,
			"entity-graph": EntityGraphDockviewPanel,
		}),
		[],
	);

	const isPersistEnabledRef = useRef(isPersistEnabled);
	isPersistEnabledRef.current = isPersistEnabled;
	const { mode } = useColorScheme();

	const onReady = useCallback(
		(event: DockviewReadyEvent) => {
			const { api } = event;

			if (isPersistEnabledRef.current) {
				try {
					const saved = localStorage.getItem(storageKey);
					if (saved) {
						api.fromJSON(JSON.parse(saved));
						api.onDidLayoutChange(() => {
							try {
								localStorage.setItem(storageKey, JSON.stringify(api.toJSON()));
							} catch (err) {
								console.warn("Failed to save dockview layout:", err);
							}
						});
						return;
					}
				} catch (err) {
					console.warn(
						"Failed to load dockview layout from localStorage:",
						err,
					);
				}
			}

			api.fromJSON(dockviewLayoutJson);

			if (isPersistEnabledRef.current) {
				api.onDidLayoutChange(() => {
					try {
						localStorage.setItem(storageKey, JSON.stringify(api.toJSON()));
					} catch (err) {
						console.warn("Failed to save dockview layout:", err);
					}
				});
			}
		},
		[storageKey],
	);

	const dockviewContextValue = useMemo<EntityPreviewDockviewContextValue>(
		() => ({
			isLoading,
			selectedEntity,
			relatedMappings,
			calculatedEntities,
			graphData,
			depthLimit,
			onDepthChange: setDepthLimit,
			onSelectNode,
		}),
		[
			isLoading,
			selectedEntity,
			relatedMappings,
			calculatedEntities,
			graphData,
			depthLimit,
			onSelectNode,
		],
	);

	return (
		<EntityPreviewDockviewContext.Provider value={dockviewContextValue}>
			<div>
				<Header>
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

				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						height: "100%",
						position: "relative",
					}}
				>
					<FlexLayoutContainer>
						<DockviewReact
							components={panelComponents}
							onReady={onReady}
							defaultTabComponent={DockviewNoCloseTab}
							rightHeaderActionsComponent={DockviewGroupMaximizeActions}
							theme={mode === "dark" ? themeAbyssSpaced : themeLightSpaced}
						/>
					</FlexLayoutContainer>
				</Box>
			</div>
		</EntityPreviewDockviewContext.Provider>
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
		"& .dockview-react": {
			height: "100%",
			width: "100%",
		},
		"& .dv-groupview": {
			borderRadius: "8px",
			border: "1px solid #a5aaba90",
			backgroundColor: theme.vars?.palette?.background.paper,
		},
		"& .dv-tabs-and-actions-container": {
			backgroundColor: theme.vars?.palette?.background.paper,
			borderBottom: "1px solid rgb(83 83 83 / 30%)",
		},
		"& .dv-content-container": {
			backgroundColor: theme.vars?.palette?.background.default,
		},
		"& .dv-tab": {
			backgroundColor: "transparent",
			color: theme.vars?.palette?.text.secondary,
			"&:hover": {
				backgroundColor: theme.vars?.palette?.action.hover,
				color: theme.vars?.palette?.text.primary,
			},
		},
		"& .dv-tab.active-tab": {
			backgroundColor: theme.vars?.palette?.action.selected,
			color: theme.vars?.palette?.primary.main,
			fontWeight: 600,
		},
		"& .dv-tab-content": {
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
