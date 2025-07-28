import DownloadIcon from "@mui/icons-material/Download";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Button, IconButton, styled } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { useGlobalSettingsStore } from "@react-client/common/store/globalSettingsStore";
import {
	CodeJsonEditor,
	type CodeJsonEditorRef,
} from "@react-client/features/codeEditor/CodeJsonEditor";
import { CommitDialog } from "@react-client/features/commitHistory/CommitDialog";
import { DataMart } from "@react-client/features/dataMart/DataMart";
import { EditorDiff } from "@react-client/features/codeEditor/EditorDiff";
import { BottomBar } from "@react-client/features/navigation/organisms/BottomBar";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { NodeGraph } from "@react-client/features/nodeGraph";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { dataLineageExample } from "@react-client/examples/dataLineageExample";
import {
	useCurrentDataLineageGraph,
	useSaveDataLineageGraph,
	DATA_LINEAGE_QUERY_KEYS,
} from "@react-client/hooks/api";
import { JSON_DATA_QUERY_KEYS } from "@react-client/hooks/api/useJsonData";
import { useRef, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useShallow } from "zustand/react/shallow";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";

export const Dashboard = () => {
	const {
		isCommitHistoryVisible,
		isDataMartVisible,
		isJsonPreviewVisible,
		toggleDataMart,
		toggleCommitHistory,
		toggleJsonPreview,
	} = useGlobalSettingsStore();

	const editorRef = useRef<CodeJsonEditorRef>(null);
	const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
	const queryClient = useQueryClient();

	const { data: graph, isLoading, refetch } = useCurrentDataLineageGraph();

	const _saveGraphMutation = useSaveDataLineageGraph();

	const {
		currentGraph,
		selectedNodes,
		currentGraphId,
		setCurrentGraph,
		setLoading,
		discardChanges,
		commitChanges: originalCommitChanges,
		hasUnsavedChanges,
		setExampleData,
		markAsChanged,
	} = useDataLineageStore(
		useShallow((state) => ({
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

	useEffect(() => {
		setLoading(isLoading);
	}, [isLoading, setLoading]);

	const handleJsonChange = (data: any) => {
		console.log("JSON данные изменены:", data);
		if (
			data &&
			typeof data === "object" &&
			data.desc &&
			data.entities &&
			data.mappings
		) {
			setCurrentGraph(data);
			markAsChanged();
		}
	};

	const handleCommitChanges = async () => {
		setIsCommitDialogOpen(true);
	};

	const handleImportJson = () => {
		editorRef.current?.importFromFile();
	};

	const handleExportJson = () => {
		editorRef.current?.exportToFile();
	};

	const _handleSetExampleData = () => {
		setExampleData(dataLineageExample);
	};

	const handleManualLoad = async () => {
		try {
			await refetch();
		} catch (error) {
			console.error("Ошибка при загрузке данных:", error);
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
							Сохранить
						</Button>
					</Flex>
				)}

				<IconButton onClick={handleImportJson} title="Импорт JSON из файла">
					<FileUploadIcon />
				</IconButton>
				<IconButton onClick={handleExportJson} title="Экспорт JSON в файл">
					<DownloadIcon />
				</IconButton>

				<IconButton
					onClick={handleManualLoad}
					disabled={isLoading}
					title="Загрузить текущее состояние"
				>
					<RefreshIcon />
				</IconButton>
			</Header>
			<Wrapper id="dashboard_page_container">
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
													ref={editorRef}
													initialData={currentGraph}
													onChange={handleJsonChange}
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
								<DataMart />
							</Card>
						</Panel>
					</PanelGroup>
				</Flex>
				<BG width="100%" height="100%">
					<NodeGraph />
				</BG>
				<BottomBar />
			</Wrapper>
			<CommitDialog
				open={isCommitDialogOpen}
				onClose={handleCommitDialogClose}
			/>
		</div>
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
	height: calc(100vh - 82px);
	position: relative;

`;

const BG = styled(Flex)`
	position: relative;
`;
