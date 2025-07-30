import DownloadIcon from "@mui/icons-material/Download";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Button, IconButton, styled, Select, MenuItem } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import AddIcon from "@mui/icons-material/Add";

import { useGlobalSettingsStore } from "@react-client/common/store/globalSettingsStore";
import { CodeJsonEditor } from "@react-client/features/codeEditor/CodeJsonEditor";
import { useEditorStore } from "@react-client/stores/editorStore";
import { CommitDialog } from "@react-client/features/commitHistory/CommitDialog";
import { EditorDiff } from "@react-client/features/codeEditor/EditorDiff";
import { BottomBar } from "@react-client/features/navigation/organisms/BottomBar";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { NodeGraph } from "@react-client/features/nodeGraph";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import {
	useSaveDataLineageGraph,
	DATA_LINEAGE_QUERY_KEYS,
	useCommitList,
} from "@react-client/api/hooks";
import { useInitializeJsonGraph } from "@react-client/api/hooks";
import { useState, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useShallow } from "zustand/react/shallow";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";
import { DataLineageGraph } from "@react-client/types/dataLineage";
import { DataMart2 } from "@react-client/features/dataMart/DataMart2";
import { dataLineageExampleData } from "@react-client/examples/dataLineageExampleData";

type LayoutType = "grid" | "force" | "hierarchical" | "circular" | "random";

const LAYOUT_OPTIONS = [
	{ value: "grid", label: "Сетка" },
	{ value: "force", label: "Силовая диаграмма" },
	{ value: "hierarchical", label: "Иерархическая" },
	{ value: "circular", label: "Круговая" },
	{ value: "random", label: "Случайная" },
] as const;

// Memoized NodeGraph to prevent unnecessary rerenders from PanelGroup
const MemoizedNodeGraph = memo(({ layoutType }: { layoutType: LayoutType }) => {
	return <NodeGraph layoutType={layoutType} />;
});

// Isolated background layer to prevent PanelGroup rerenders from affecting NodeGraph
const BackgroundLayer = memo(({ layoutType }: { layoutType: LayoutType }) => {
	return (
		<BG width="100%" height="100%">
			<MemoizedNodeGraph layoutType={layoutType} />
		</BG>
	);
});

export const Dashboard = () => {
	const { importFromFile, exportToFile } = useEditorStore();
	const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [layoutType, setLayoutType] = useState<LayoutType>("grid");
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

	// useEffect(() => {
	// 	setLoading(isLoading);
	// }, [isLoading, setLoading]);

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
			// Delay setting isInitializing to false to allow JSON processing to complete
			setTimeout(() => {
				console.log("[DEBUG] Dashboard: handleInitializeGraph finished");
				setIsInitializing(false);
			}, 100);
		} catch (error) {
			console.error("Failed to initialize graph:", error);
			setIsInitializing(false);
		}
	};

	return (
		<div>
			<Header>
				{/* <Search /> */}

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
				<Panels isInitializing={isInitializing} />
				<BackgroundLayer layoutType={layoutType} />
				<BottomBar />
			</Wrapper>
			<CommitDialog
				open={isCommitDialogOpen}
				onClose={handleCommitDialogClose}
			/>
		</div>
	);
};

const Panels = ({ isInitializing }: { isInitializing: boolean }) => {
	const {
		isCommitHistoryVisible,
		isDataMartVisible,
		isJsonPreviewVisible,
		toggleDataMart,
		toggleCommitHistory,
		toggleJsonPreview,
	} = useGlobalSettingsStore();

	const { currentGraph, setCurrentGraph, setExampleData, markAsChanged } =
		useDataLineageStore(
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
			})),
		);

	const _handleSetExampleData = () => {
		setExampleData(dataLineageExampleData);
	};

	const handleJsonChange = (data: any) => {
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
				// markAsChanged();
			} else {
				console.log(
					"[DEBUG] Dashboard: handleJsonChange skipping markAsChanged (initializing)",
				);
			}
		}
	};

	return (
		<Flex
			position="absolute"
			width="100%"
			height="100%"
			left={0}
			top={0}
			zIndex={1}
			pointerEvents="none"
		>
			<PanelGroup
				autoSaveId="dashboard_page_container_ver"
				direction="vertical"
			>
				<Panel>
					<PanelGroup
						direction="horizontal"
						autoSaveId="dashboard_page_container_hor"
					>
						<Panel>
							<Card
								header="Редактор"
								height="100%"
								zoom={0.7}
								uuid="json_editor"
								onClose={toggleJsonPreview}
								style={{
									visibility: isJsonPreviewVisible ? undefined : "hidden",
									display: isJsonPreviewVisible ? undefined : "none",
								}}
							>
								<PanelGroup direction="horizontal">
									<Panel>
										<CodeJsonEditor
											initialData={currentGraph}
											onChange={handleJsonChange}
											isInitializing={isInitializing}
										/>
									</Panel>
									<PanelResizeHandleStyled>
										<DragIndicatorIcon />
									</PanelResizeHandleStyled>
									<Panel>
										<EditorDiff />
									</Panel>
								</PanelGroup>
							</Card>
						</Panel>

						<PanelResizeHandleStyled
							style={{
								visibility:
									isCommitHistoryVisible || isJsonPreviewVisible
										? undefined
										: "hidden",
								display:
									isCommitHistoryVisible || isJsonPreviewVisible
										? undefined
										: "none",
							}}
						>
							<DragIndicatorIcon />
						</PanelResizeHandleStyled>

						<Panel>
							<Card
								header="История коммитов"
								maxHeight="100%"
								height="100%"
								zoom={0.7}
								uuid="commit_history"
								onClose={toggleCommitHistory}
								style={{
									visibility: isCommitHistoryVisible ? undefined : "hidden",
									display: isCommitHistoryVisible ? undefined : "none",
								}}
							>
								<CommitHistory />
							</Card>
						</Panel>
					</PanelGroup>
				</Panel>

				<PanelResizeHandleStyled
					vertical
					style={{
						visibility:
							isCommitHistoryVisible ||
							isJsonPreviewVisible ||
							isDataMartVisible
								? undefined
								: "hidden",
						display:
							isCommitHistoryVisible ||
							isJsonPreviewVisible ||
							isDataMartVisible
								? undefined
								: "none",
					}}
				>
					<DragIndicatorIcon />
				</PanelResizeHandleStyled>

				<Panel>
					<Card
						header="Витрина"
						maxHeight="100%"
						height="100%"
						zoom={0.7}
						uuid="data_mart"
						onClose={toggleDataMart}
						style={{
							visibility: isDataMartVisible ? undefined : "hidden",
							display: isDataMartVisible ? undefined : "none",
						}}
					>
						<DataMart2 />
					</Card>
				</Panel>
			</PanelGroup>
		</Flex>
	);
};

const PanelResizeHandleStyled = styled(PanelResizeHandle, {
	shouldForwardProp: (prop) =>
		!["vertical", "visible"].includes(prop as string),
})<{
	vertical?: boolean;
	visible?: boolean;
}>`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 18px;


	svg {
		${(props) => (props.vertical ? "transform: rotate(90deg); height: 100%;" : "width: 100%;")}
	}

	${(props) => props.vertical && "width: 100%; height: 18px;"}
	/* ${(props) => props.visible && "visibility: hidden;"} */
`;

const Wrapper = styled("div")`
	height: calc(100vh - 64px);
	position: relative;

`;

const BG = styled(Flex)`
	position: relative;
`;
