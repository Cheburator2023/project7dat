import DownloadIcon from "@mui/icons-material/Download";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
	Button,
	IconButton,
	styled,
	Select,
	MenuItem,
	useColorScheme,
} from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";
import AddIcon from "@mui/icons-material/Add";
import { Layout, Model, TabNode, Action } from "flexlayout-react";
import "flexlayout-react/style/light.css";
import { CodeJsonEditor } from "@react-client/features/codeEditor/CodeJsonEditor";
import { useEditorStore } from "@react-client/stores/editorStore";
import { CommitDialog } from "@react-client/features/commitHistory/CommitDialog";
import { EditorDiff } from "@react-client/features/codeEditor/EditorDiff";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { NodeGraph } from "@react-client/features/nodeGraph";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import {
	useSaveDataLineageGraph,
	DATA_LINEAGE_QUERY_KEYS,
	useCommitList,
	useCurrentDataLineageGraph,
} from "@react-client/api/hooks";
import { useInitializeJsonGraph } from "@react-client/api/hooks";
import { useState, memo, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";
import { DataLineageGraph } from "@react-client/types/dataLineage";
import { DataMart } from "@react-client/features/dataMart/DataMart";
import { EntityPreviewNavigationButton } from "@react-client/features/entityPreview/EntityPreviewNavigationButton";
import { dataLineageExampleData } from "@react-client/examples/dataLineageExampleData";

type LayoutType = "grid" | "force" | "hierarchical" | "circular" | "random";

const LAYOUT_OPTIONS = [
	{ value: "grid", label: "Сетка" },
	{ value: "force", label: "Силовая диаграмма" },
	{ value: "hierarchical", label: "Иерархическая" },
	{ value: "circular", label: "Круговая" },
	{ value: "random", label: "Случайная" },
] as const;

const MemoizedNodeGraph = memo(({ layoutType }: { layoutType: LayoutType }) => {
	return <NodeGraph layoutType={layoutType} />;
});

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
						component: "node-graph",
						id: "node-graph-tab",
					},
				],
			},
			{
				type: "tabset",
				weight: 30,
				children: [
					{
						type: "tab",
						name: "Редактор",
						component: "editor",
						id: "editor-tab",
					},
				],
			},
			{
				type: "tabset",
				weight: 20,
				children: [
					{
						type: "tab",
						name: "История коммитов",
						component: "commit-history",
						id: "commit-history-tab",
					},
					{
						type: "tab",
						name: "Витрина",
						component: "data-mart",
						id: "data-mart-tab",
					},
				],
			},
		],
	},
};

export const DashboardFlex = () => {
	const { refetch: refetchCurrentGraph } = useCurrentDataLineageGraph();

	const _theme = useColorScheme();
	const { importFromFile, exportToFile } = useEditorStore();

	const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [layoutType, setLayoutType] = useState<LayoutType>("grid");
	const [model, _setModel] = useState(() => {
		try {
			const savedLayout = localStorage.getItem("dashboard-flex-layout");
			if (savedLayout) {
				return Model.fromJson(JSON.parse(savedLayout));
			}
		} catch (error) {
			console.warn("Failed to load layout from localStorage:", error);
		}
		return Model.fromJson(flexLayoutJson);
	});
	const queryClient = useQueryClient();
	const initializeGraphMutation = useInitializeJsonGraph();

	const _saveGraphMutation = useSaveDataLineageGraph();

	const {
		currentGraphId,
		setCurrentGraph,
		setLoading,
		discardChanges,
		hasUnsavedChanges,
		setCurrentGraphId,
		initializeGraph,
		currentGraph,
		markAsChanged,
	} = useDataLineageStore(
		useShallow((state) => ({
			setCurrentGraphId: state.setCurrentGraphId,
			hasUnsavedChanges: state.hasUnsavedChanges,
			commitChanges: state.commitChanges,
			discardChanges: state.discardChanges,
			currentGraph: state.currentGraph,
			currentGraphId: state.currentGraphId,
			selectedNodes: state.selectedNodes,
			setCurrentGraph: state.setCurrentGraph,
			setGraphs: state.setGraphs,
			setLoading: state.setLoading,
			setExampleData: state.setExampleData,
			markAsChanged: state.markAsChanged,
			initializeGraph: state.initializeGraph,
		})),
	);

	const handleCommitChanges = async () => {
		setIsCommitDialogOpen(true);
	};

	const handleImport = () => {
		if (!currentGraph) return;
		importFromFile();
	};

	const handleExport = () => {
		exportToFile();
	};

	const handleManualLoad = async () => {
		try {
			await refetchCurrentGraph();
			if (currentGraphId) {
				await refetchCommitList();
			}
		} catch (error) {
			console.error("Ошибка при загрузке данных:", error);
		}
	};

	const { refetch: refetchCommitList } = useCommitList({
		graphId: currentGraphId || undefined,
	});

	const handleCommitDialogClose = () => {
		setIsCommitDialogOpen(false);
		queryClient.invalidateQueries({
			queryKey: DATA_LINEAGE_QUERY_KEYS.current(),
		});
		if (currentGraphId) {
			refetchCommitList();
		}
	};

	const handleInitializeGraph = async () => {
		console.log("[DEBUG] Dashboard: handleInitializeGraph started");
		setIsInitializing(true);
		try {
			console.log("[DEBUG] Dashboard: calling initializeGraphMutation");
			const result = await initializeGraphMutation.mutateAsync({
				data: dataLineageExampleData,
			});
			console.log(
				"[DEBUG] Dashboard: mutation completed, calling initializeGraph",
			);
			initializeGraph(result.data as DataLineageGraph);
			console.log("[DEBUG] Dashboard: calling setCurrentGraphId");
			setCurrentGraphId(result.id);
			setTimeout(() => {
				console.log("[DEBUG] Dashboard: handleInitializeGraph finished");
				setIsInitializing(false);
			}, 100);
		} catch (error) {
			console.error("Failed to initialize graph:", error);
			setIsInitializing(false);
		}
	};

	const handleJsonChange = useCallback(
		(data: any) => {
			console.log("[DEBUG] Dashboard: handleJsonChange called", {
				isInitializing,
				data: !!data,
			});
			console.log("JSON данные изменены:", data);
			if (
				data &&
				typeof data === "object" &&
				data.desc &&
				data.entities &&
				data.mappings
			) {
				console.log(
					"[DEBUG] Dashboard: handleJsonChange calling setCurrentGraph",
				);
				setCurrentGraph(data);
				if (!isInitializing) {
					console.log(
						"[DEBUG] Dashboard: handleJsonChange calling markAsChanged",
					);
				}
			}
		},
		[isInitializing, setCurrentGraph, markAsChanged],
	);

	const editorLayoutModel = useMemo(
		() =>
			Model.fromJson({
				global: {
					tabEnableClose: false,
					tabEnableRename: false,
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
									name: "JSON Редактор",
									component: "json-editor",
								},
							],
						},
						{
							type: "tabset",
							weight: 50,
							children: [
								{
									type: "tab",
									name: "Diff",
									component: "editor-diff",
								},
							],
						},
					],
				},
			}),
		[],
	);

	const editorFactory = (innerNode: TabNode) => {
		const innerComponent = innerNode.getComponent();
		switch (innerComponent) {
			case "json-editor":
				return (
					<CodeJsonEditor
						initialData={currentGraph}
						onChange={handleJsonChange}
						isInitializing={isInitializing}
					/>
				);
			case "editor-diff":
				return <EditorDiff />;
			default:
				return <div>Unknown component: {innerComponent}</div>;
		}
	};

	const factory = useCallback(
		(node: TabNode) => {
			const component = node.getComponent();

			switch (component) {
				case "node-graph":
					return (
						<GraphContainer>
							<MemoizedNodeGraph layoutType={layoutType} />
						</GraphContainer>
					);
				case "editor":
					return (
						<EditorContainer>
							<Layout model={editorLayoutModel} factory={editorFactory} />
						</EditorContainer>
					);
				case "commit-history":
					return <CommitHistory />;
				case "data-mart":
					return <DataMart />;
				default:
					return <div>Unknown component: {component}</div>;
			}
		},
		[layoutType, editorLayoutModel, editorFactory],
	);

	const onAction = useCallback(
		(action: Action) => {
			const result = action;

			setTimeout(() => {
				try {
					const layoutJson = model.toJson();
					localStorage.setItem(
						"dashboard-flex-layout",
						JSON.stringify(layoutJson),
					);
				} catch (error) {
					console.warn("Failed to save layout to localStorage:", error);
				}
			}, 0);

			return result;
		},
		[model],
	);

	return (
		<div>
			<Header>
				{currentGraphId && <span>Текущий граф: {currentGraphId}</span>}
				{hasUnsavedChanges && (
					<Flex gap={6}>
						<Button
							variant="outlined"
							color="error"
							onClick={discardChanges}
							size="small"
						>
							Отменить
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={handleCommitChanges}
							size="small"
						>
							Создать коммит
						</Button>
					</Flex>
				)}

				<Flex
					width={`calc(${LAYOUT_OPTIONS.find((o) => o.value === layoutType)?.label?.replace(" ", "")?.length ?? 0 + 5} * 16px)`}
				>
					<Select
						value={layoutType}
						onChange={(e) => setLayoutType(e.target.value as LayoutType)}
						label="Разметка графа"
						autoWidth
						size="small"
						fullWidth
					>
						{LAYOUT_OPTIONS.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</Select>
				</Flex>

				<Button
					variant="outlined"
					size="small"
					startIcon={<AddIcon />}
					onClick={handleInitializeGraph}
					disabled={isInitializing}
					title="Инициализация графа"
				>
					{isInitializing ? "Инициализация..." : "Инициализировать новый json"}
				</Button>

				<EntityPreviewNavigationButton />

				<IconButton
					onClick={handleImport}
					title="Импорт JSON из файла"
					disabled={!currentGraph}
				>
					<FileUploadIcon />
				</IconButton>
				<IconButton onClick={handleExport} title="Экспорт JSON в файл">
					<DownloadIcon />
				</IconButton>

				<IconButton
					onClick={handleManualLoad}
					title="Загрузить текущее состояние"
				>
					<RefreshIcon />
				</IconButton>
			</Header>
			<Wrapper id="dashboard_page_container">
				<FlexLayoutContainer>
					<Layout
						model={model}
						factory={factory}
						onAction={onAction}
						realtimeResize
					/>
				</FlexLayoutContainer>
				{/* <BottomBar /> */}
			</Wrapper>
			<CommitDialog
				open={isCommitDialogOpen}
				onClose={handleCommitDialogClose}
			/>
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
			// @ts-ignore
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

const EditorContainer = styled("div")(
	({ theme }) => `
	height: 100%;
	width: 100%;
	background-color: ${theme.vars?.palette?.background.paper};
	color: ${theme.vars?.palette?.text.primary};
`,
);

const GraphContainer = styled("div")(
	({ theme }) => `
	height: 100%;
	width: 100%;
	position: relative;
	background-color: transparent;
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
