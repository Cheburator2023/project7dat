import DownloadIcon from "@mui/icons-material/Download";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DatasetIcon from "@mui/icons-material/Dataset";
import { Button, IconButton, styled, Tooltip } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { useGlobalSettingsStore } from "@react-client/common/store/globalSettingsStore";
import {
	CodeJsonEditor,
	type CodeJsonEditorRef,
} from "@react-client/features/codeEditor/CodeJsonEditor";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";
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
} from "@react-client/hooks/api";
import { useRef, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useShallow } from "zustand/react/shallow";

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

	const { data: graph, isLoading } = useCurrentDataLineageGraph();

	const saveGraphMutation = useSaveDataLineageGraph();

	const {
		currentGraph,
		selectedNodes,
		setCurrentGraph,
		setLoading,
		discardChanges,
		commitChanges: originalCommitChanges,
		hasUnsavedChanges,
		setExampleData,
	} = useDataLineageStore(
		useShallow((state) => ({
			hasUnsavedChanges: state.hasUnsavedChanges,
			commitChanges: state.commitChanges,
			discardChanges: state.discardChanges,
			currentGraph: state.currentGraph,
			selectedNodes: state.selectedNodes,
			setCurrentGraph: state.setCurrentGraph,
			setGraphs: state.setGraphs,
			setLoading: state.setLoading,
			setExampleData: state.setExampleData,
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
		}
	};

	const handleCommitChanges = async () => {
		console.log(
			"🐸 Pepe said >> handleCommitChanges >> currentGraph:",
			currentGraph,
		);
		try {
			if (currentGraph) {
				await saveGraphMutation.mutateAsync(currentGraph);
				console.log("Данные успешно сохранены в API");
			}
			originalCommitChanges();
		} catch (error) {
			console.error("Ошибка при сохранении данных:", error);
		}
	};

	const handleImportJson = () => {
		editorRef.current?.importFromFile();
	};

	const handleExportJson = () => {
		editorRef.current?.exportToFile();
	};

	const handleSetExampleData = () => {
		setExampleData(dataLineageExample);
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

				<Tooltip title="Импорт JSON из файла">
					<IconButton onClick={handleImportJson}>
						<UploadFileIcon />
					</IconButton>
				</Tooltip>
				<Tooltip title="Экспорт JSON в файл">
					<IconButton onClick={handleExportJson}>
						<DownloadIcon />
					</IconButton>
				</Tooltip>
				<Tooltip title="Загрузить пример данных">
					<IconButton onClick={handleSetExampleData}>
						<DatasetIcon />
					</IconButton>
				</Tooltip>
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
