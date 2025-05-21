import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { styled } from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useNavigate } from "react-router";

interface DashboardProps {
	leftPanel: React.ReactNode;
	rightPanel: React.ReactNode;
	bottomPanel: React.ReactNode;
	backgroundPanel?: React.ReactNode;
}

export const Dashboard: React.FC<DashboardProps> = ({
	leftPanel,
	rightPanel,
	bottomPanel,
	backgroundPanel,
}) => {
	const navigate = useNavigate();

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
							<Panel defaultSize={30} minSize={20}>
								{leftPanel}
							</Panel>
							<PanelResizeHandleStyled>
								<DragIndicatorIcon />
							</PanelResizeHandleStyled>
							<Panel defaultSize={30} minSize={20}>
								{rightPanel}
							</Panel>
						</PanelGroup>
					</Panel>
					<PanelResizeHandleStyled vertical>
						<DragIndicatorIcon />
					</PanelResizeHandleStyled>
					<Panel maxSize={75}>{bottomPanel}</Panel>
				</PanelGroup>
			</Flex>
			<BG>{backgroundPanel}</BG>
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
