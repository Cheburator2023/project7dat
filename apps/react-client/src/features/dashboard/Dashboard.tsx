import DownloadIcon from "@mui/icons-material/Download";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { styled } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { useGlobalSettingsStore } from "@react-client/common/store/globalSettingsStore";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";
import { Search } from "@react-client/features/dashboard/Search";
import { DataMart } from "@react-client/features/dataMart/DataMart";
import { EditorDiff } from "@react-client/features/diff/EditorDiff";
import { Editor } from "@react-client/features/json4u/containers/editor/editor/Editor";
import { Graph } from "@react-client/features/json4u/containers/editor/graph/Graph";
import { ExportPopover } from "@react-client/features/json4u/containers/editor/sidenav/ExportPopover";
import { ImportPopover } from "@react-client/features/json4u/containers/editor/sidenav/ImportPopover";
import { PopoverButton } from "@react-client/features/json4u/containers/editor/sidenav/PopoverButton";
import { BottomBar } from "@react-client/features/navigation/organisms/BottomBar";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export const Dashboard = () => {
	const {
		isCommitHistoryVisible,
		isDataMartVisible,
		isJsonPreviewVisible,
		toggleDataMart,
		toggleCommitHistory,
		toggleJsonPreview,
	} = useGlobalSettingsStore();

	return (
		<div>
			<Header>
				<Search />
				<PopoverButton
					// title={"Импорт"}
					icon={<UploadFileIcon className="icon" />}
					content={<ImportPopover />}
				/>
				<PopoverButton
					// title={"Экспорт"}
					icon={<DownloadIcon />}
					content={<ExportPopover />}
				/>
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
										onClose={toggleJsonPreview}
										style={{
											visibility: isJsonPreviewVisible ? undefined : "hidden",
											display: isJsonPreviewVisible ? undefined : "none",
										}}
									>
										<PanelGroup direction="horizontal">
											<Panel>
												<Editor kind="main" />
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
					<Graph />
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
