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
import { dataLineageExample } from "@react-client/examples/dataLineageExample";
import {
	useSaveDataLineageGraph,
	DATA_LINEAGE_QUERY_KEYS,
} from "@react-client/hooks/api";
import {
	JSON_DATA_QUERY_KEYS,
	useInitializeJsonGraph,
} from "@react-client/hooks/api/useJsonData";
import { useState, memo, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";
import { DataLineageGraph } from "@react-client/types/dataLineage";
import { DataMart2 } from "@react-client/features/dataMart/DataMart2";

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
						name: "Граф узлов",
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
	const theme = useColorScheme();
	const { importFromFile, exportToFile } = useEditorStore();

	const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [layoutType, setLayoutType] = useState<LayoutType>("grid");
	const [model] = useState(() => Model.fromJson(flexLayoutJson));
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
		importFromFile();
	};

	const handleExport = () => {
		exportToFile();
	};

	const handleManualLoad = async () => {
		try {
			// await refetch();
		} catch (_error) {
			// console.error("Ошибка при загрузке данных:", error);
		}
	};

	const handleCommitDialogClose = () => {
		setIsCommitDialogOpen(false);
		queryClient.invalidateQueries({
			queryKey: DATA_LINEAGE_QUERY_KEYS.current(),
		});
		if (currentGraphId) {
			queryClient.invalidateQueries({
				queryKey: JSON_DATA_QUERY_KEYS.commitList({ graphId: currentGraphId }),
			});
		}
	};

	const handleInitializeGraph = async () => {
		console.log("[DEBUG] Dashboard: handleInitializeGraph started");
		setIsInitializing(true);
		try {
			console.log("[DEBUG] Dashboard: calling initializeGraphMutation");
			const result = await initializeGraphMutation.mutateAsync({
				data: dataLineageExample,
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
		[isInitializing, setCurrentGraph],
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
					return <DataMart2 />;
				default:
					return <div>Unknown component: {component}</div>;
			}
		},
		[layoutType, editorLayoutModel, editorFactory],
	);

	const onAction = useCallback((action: Action) => {
		return action;
	}, []);

	return (
		<div>
			<Header>
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
					{isInitializing ? "Инициализация..." : "Создать граф"}
				</Button>

				<IconButton onClick={handleImport} title="Импорт JSON из файла">
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
					<Layout model={model} factory={factory} onAction={onAction} />
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
	console.log("🚀 ~ FlexLayoutContainer ~ theme:", theme);
	return {
		position: "absolute",
		width: "100%",
		height: "100%",
		left: 0,
		top: 0,
		zIndex: 1,
		pointerEvents: "auto",
		backgroundColor: theme.vars?.palette?.background.default,
		color: theme.vars?.palette?.text.primary,
		"& .flexlayout__layout": {
			backgroundColor: theme.vars?.palette?.background.default,
		},
		"& .flexlayout__splitter": {
			backgroundColor: theme.vars?.palette?.divider,
		},
		"& .flexlayout__tab": {
			backgroundColor: theme.vars?.palette?.background.paper,
			color: theme.vars?.palette?.text.primary,
			borderColor: theme.vars?.palette?.divider,
		},
		"& .flexlayout__tab_selected": {
			backgroundColor: theme.vars?.palette?.background.default,
			color: theme.vars?.palette?.text.primary,
		},
		"& .flexlayout__tabset_header": {
			backgroundColor: theme.vars?.palette?.background.paper,
			borderColor: theme.vars?.palette?.divider,
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
	background-color: ${theme.vars?.palette?.background.paper};
	color: ${theme.vars?.palette?.text.primary};
`,
);

const Wrapper = styled("div")(
	({ theme }) => `
	height: calc(100vh - 82px);
	position: relative;
	background-color: ${theme.vars?.palette?.background.default};
	color: ${theme.vars?.palette?.text.primary};
`,
);

const _BG = styled(Flex)`
	position: relative;
`;
