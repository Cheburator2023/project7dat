import {
	useState,
	useCallback,
	useMemo,
	useEffect,
	useRef,
	useContext,
	createContext,
	type ChangeEvent,
	type FunctionComponent,
	type ReactNode,
} from "react";

import {
	styled,
	Box,
	Alert,
	Chip,
	TextField,
	InputAdornment,
	useColorScheme,
} from "@mui/material";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { usePanelSettingsStore } from "@react-client/common/stores/panelSettingsStore";
import { EntityJsonEditor } from "../organisms/EntityJsonEditor";
import { EntityDetailsView } from "../organisms/EntityDetailsView";
import { useParams, useSearchParams } from "react-router-dom";
import { Flex } from "@react-client/common/primitives/Flex";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";

import {
	Storage as StorageIcon,
	HelpOutline as HelpOutlineIcon,
	TableChart as TableChartIcon,
	ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import { ModelGraphPanel } from "@react-client/features/modelPreview/organisms/ModelGraphPanel";
import { SearchIcon } from "lucide-react";
import { usePaginatedModelRelations } from "@react-client/api/hooks/usePaginatedModelRelations";
import { useEntitiesStore } from "@react-client/features/entities/stores";
import { SkeletonFade } from "@react-client/common/skeleton/atoms/SkeletonFade";
import { SkeletonBlock } from "@react-client/common/skeleton/atoms/SkeletonBlock";
import { SkeletonList } from "@react-client/common/skeleton/molecules/SkeletonList";

import {
	DockviewReadyEvent,
	IDockviewPanelProps,
	Orientation,
	SerializedDockview,
	themeAbyssSpaced,
	themeLightSpaced,
} from "@react-client/features/dockview/core";
import { DockviewReact } from "@react-client/features/dockview/src";
import { DockviewNoCloseTab } from "@react-client/common/dockview/DockviewNoCloseTab";
import { DockviewGroupMaximizeActions } from "@react-client/common/dockview/DockviewGroupMaximizeActions";

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

type ModelPreviewDockviewContextValue = {
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

const ModelPreviewDockviewContext =
	createContext<ModelPreviewDockviewContextValue>({
		isLoading: false,
		selectedEntity: null,
		relatedMappings: [],
		calculatedEntities: [],
		graphData: undefined,
		depthLimit: 1,
		onDepthChange: () => {},
		onSelectNode: () => {},
	});

const useModelPreviewDockviewContext = (): ModelPreviewDockviewContextValue =>
	useContext(ModelPreviewDockviewContext);

// Stable selectors for useEntitiesStore
const selectGlobalAttributeSearchQuery = (state: {
	globalAttributeSearchQuery: string;
}) => state.globalAttributeSearchQuery;

const selectSetGlobalAttributeSearch = (state: {
	setGlobalAttributeSearch: (query: string) => void;
}) => state.setGlobalAttributeSearch;

export const ModelPreviewPage: FunctionComponent<EntityPreviewPageProps> = ({
	entityId: propEntityId,
}) => {
	const [currentEntityId, setCurrentEntityId] = useState<string | undefined>(
		undefined,
	);
	const [depthLimit, setDepthLimit] = useState(1);

	const isPersistEnabled = usePanelSettingsStore((state) =>
		state.isPanelPersistEnabled("model-preview"),
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

	const storage = useMemo(() => {
		const state = usePanelSettingsStore.getState();
		const panel = state.panels.find((p) => p.id === "model-preview");
		return {
			key: panel?.localStorageKey ?? "model-preview-dockview-layout",
			legacyKeys: panel?.legacyLocalStorageKeys ?? ["model-preview-layout"],
		};
	}, []);

	const targetEntityId = useMemo(() => {
		const decodedUrlEntityId = urlEntityId
			? decodeURIComponent(urlEntityId)
			: undefined;
		return currentEntityId || propEntityId || decodedUrlEntityId || "";
	}, [currentEntityId, propEntityId, urlEntityId]);
	console.log(
		"🐸 Pepe said >> ModelPreviewPage >> targetEntityId:",
		targetEntityId,
	);

	const { data: modelRelationsData, isLoading } = usePaginatedModelRelations({
		modelId: targetEntityId,
		page: 1,
		limit: 10000,
		enabled: !!targetEntityId,
	});
	console.log("🐸 Pepe said >> ModelPreviewPage >> isLoading:", isLoading);

	const selectedEntity = useMemo(() => {
		if (modelRelationsData?.entity) {
			return modelRelationsData.entity as DataLineageEntity;
		}
		return null;
	}, [modelRelationsData]);

	const relatedMappings = useMemo(() => {
		if (modelRelationsData?.mappings?.length) {
			return modelRelationsData.mappings.map((mapping, index) => ({
				...mapping,
				id: mapping.entity_map_id ?? mapping.target_id ?? index,
			})) as DataLineageMapping[];
		}
		return [];
	}, [modelRelationsData]);

	const graphData = useMemo(() => {
		if (!selectedEntity) return undefined;

		const allEntityIds = new Set<string>([selectedEntity.id]);
		for (const mapping of relatedMappings) {
			allEntityIds.add(mapping.entityId);
			for (const dep of mapping.deps ?? []) {
				allEntityIds.add(dep.entityId);
			}
		}

		const entitiesFromEndpoint = modelRelationsData?.relatedEntities ?? [];

		const entityMap = new Map<string, DataLineageEntity>();
		entityMap.set(selectedEntity.id, selectedEntity);
		for (const entity of entitiesFromEndpoint) {
			entityMap.set(entity.id, entity as DataLineageEntity);
		}

		return {
			entities: Array.from(entityMap.values()),
			mappings: relatedMappings,
		};
	}, [selectedEntity, relatedMappings, modelRelationsData]);

	const calculatedEntities = useMemo(
		() => graphData?.entities ?? [],
		[graphData?.entities],
	);

	const onSelectNode = useCallback((data: any) => setCurrentEntityId(data), []);
	const { mode } = useColorScheme();

	const panelComponents: Record<
		string,
		FunctionComponent<IDockviewPanelProps>
	> = useMemo(
		() => ({
			"entity-details": EntityDetailsPanel,
			"entity-json": EntityJsonPanel,
			"entity-graph": EntityGraphDockviewPanel,
		}),
		[],
	);

	const isPersistEnabledRef = useRef(isPersistEnabled);
	isPersistEnabledRef.current = isPersistEnabled;

	const onReady = useCallback(
		(event: DockviewReadyEvent) => {
			const { api } = event;

			if (isPersistEnabledRef.current) {
				try {
					const saved = localStorage.getItem(storage.key);
					if (saved) {
						api.fromJSON(JSON.parse(saved));
						api.onDidLayoutChange(() => {
							try {
								localStorage.setItem(storage.key, JSON.stringify(api.toJSON()));
							} catch (err) {
								console.warn("Failed to save dockview layout:", err);
							}
						});
						return;
					}

					for (const legacyKey of storage.legacyKeys) {
						const legacySaved = localStorage.getItem(legacyKey);
						if (legacySaved) {
							api.fromJSON(JSON.parse(legacySaved));
							api.onDidLayoutChange(() => {
								try {
									localStorage.setItem(
										storage.key,
										JSON.stringify(api.toJSON()),
									);
								} catch (err) {
									console.warn("Failed to save dockview layout:", err);
								}
							});
							return;
						}
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
						localStorage.setItem(storage.key, JSON.stringify(api.toJSON()));
					} catch (err) {
						console.warn("Failed to save dockview layout:", err);
					}
				});
			}
		},
		[storage.key, storage.legacyKeys],
	);

	return (
		<div>
			<Header
				title={
					<Flex gap={10}>
						{selectedEntity?.namespace}

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
				<DockviewContainer>
					<ModelPreviewDockviewContext.Provider
						value={{
							isLoading,
							selectedEntity,
							relatedMappings,
							calculatedEntities,
							graphData,
							depthLimit,
							onDepthChange: setDepthLimit,
							onSelectNode,
						}}
					>
						<DockviewReact
							components={panelComponents}
							onReady={onReady}
							defaultTabComponent={DockviewNoCloseTab}
							rightHeaderActionsComponent={DockviewGroupMaximizeActions}
							theme={mode === "dark" ? themeAbyssSpaced : themeLightSpaced}
						/>
					</ModelPreviewDockviewContext.Provider>
				</DockviewContainer>
			</Wrapper>
		</div>
	);
};

const EntityDetailsPanel: FunctionComponent<IDockviewPanelProps> = () => {
	const { isLoading, selectedEntity, relatedMappings, calculatedEntities } =
		useModelPreviewDockviewContext();

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

const EntityJsonPanel: FunctionComponent<IDockviewPanelProps> = () => {
	const { isLoading, selectedEntity } = useModelPreviewDockviewContext();

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
	const {
		isLoading,
		selectedEntity,
		graphData,
		depthLimit,
		onDepthChange,
		onSelectNode,
	} = useModelPreviewDockviewContext();

	return (
		<ModelGraphPanel
			onSelectNode={onSelectNode}
			entity={selectedEntity}
			isLoading={isLoading}
			graphData={graphData}
			depthLimit={depthLimit}
			onDepthChange={onDepthChange}
		/>
	);
};

const DockviewContainer = styled("div")(({ theme }) => {
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

const Wrapper = styled("div")(
	({ theme }) => `
	height: calc(100vh - 64px);
	position: relative;
	background-color: transparent;
	color: ${theme.vars?.palette?.text.primary};
`,
);
