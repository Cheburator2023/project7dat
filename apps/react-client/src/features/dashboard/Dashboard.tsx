import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { styled } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { useGlobalSettingsStore } from "@react-client/common/store/globalSettingsStore";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";
import { DataMart } from "@react-client/features/dataMart/DataMart";
import { Graph } from "@react-client/features/json4u/containers/editor/graph/Graph";
import { JsonEditorWithDiff } from "@react-client/features/jsonEditor/organisms/JsonEditorWithDiff";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export const Dashboard: React.FC = () => {
	const {
		isCommitHistoryVisible,
		isDataMartVisible,
		isJsonPreviewVisible,
		toggleDataMart,
		toggleCommitHistory,
		toggleJsonPreview,
	} = useGlobalSettingsStore();

	return (
		<Wrapper id="dashboard_page_container">
			<Flex position="absolute" width="100%" height="100%" left={0} top={0}>
				<PanelGroup
					autoSaveId="dashboard_page_container_ver"
					direction="vertical"
				>
					<Panel maxSize={75}>
						<PanelGroup
							direction="horizontal"
							autoSaveId="dashboard_page_container_hor"
						>
							{isJsonPreviewVisible && (
								<>
									<Panel defaultSize={30} minSize={20}>
										<Card
											header="Редактор"
											maxHeight="100%"
											height="100%"
											onClose={toggleJsonPreview}
										>
											<JsonEditorWithDiff />
										</Card>
									</Panel>
								</>
							)}
							{isCommitHistoryVisible && (
								<>
									<PanelResizeHandleStyled>
										<DragIndicatorIcon />
									</PanelResizeHandleStyled>
									<Panel defaultSize={30} minSize={20}>
										<Card
											header="История коммитов"
											maxHeight="100%"
											height="100%"
											onClose={toggleCommitHistory}
										>
											<CommitHistory />
										</Card>
									</Panel>
								</>
							)}
						</PanelGroup>
					</Panel>
					{isDataMartVisible && (
						<>
							<PanelResizeHandleStyled vertical>
								<DragIndicatorIcon />
							</PanelResizeHandleStyled>
							<Panel maxSize={75}>
								<Card
									header="Витрина"
									maxHeight="100%"
									height="100%"
									onClose={toggleDataMart}
								>
									<DataMart />
								</Card>
							</Panel>
						</>
					)}
				</PanelGroup>
			</Flex>
			<BG>
				<Graph />
			</BG>
		</Wrapper>
	);
};

const PanelResizeHandleStyled = styled(PanelResizeHandle)<{
	vertical?: boolean;
}>`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 18px;

	svg {
		${(props) => (props.vertical ? "transform: rotate(90deg); height: 100%;" : "width: 100%;")}
	}

	${(props) => props.vertical && "width: 100%; height: 18px;"}
`;

const Wrapper = styled("div")`
	height: calc(100vh - 82px);
	position: relative;

`;

const BG = styled("div")`

	
`;
