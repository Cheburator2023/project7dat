import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { styled } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export const DashboardPage = () => {
	return (
		<Wrapper id="dashboard_page_container">
			<Flex position="absolute" width="100%" height="100%">
				<PanelGroup direction="vertical">
					<Panel maxSize={75}>
						<PanelGroup direction="horizontal">
							<Panel defaultSize={30} minSize={20}>
								<Card maxHeight="100%" height="100%">
									left
								</Card>
							</Panel>
							<PanelResizeHandleStyled>
								<DragIndicatorIcon />
							</PanelResizeHandleStyled>
							<Panel defaultSize={30} minSize={20}>
								<Card maxHeight="100%" height="100%">
									right
								</Card>
							</Panel>
						</PanelGroup>
					</Panel>
					<PanelResizeHandleStyled vertical>
						<DragIndicatorIcon />
					</PanelResizeHandleStyled>
					<Panel maxSize={75}>
						<Card maxHeight="100%" height="100%">
							bottom
						</Card>
					</Panel>
				</PanelGroup>
			</Flex>
			<BG>bg</BG>
		</Wrapper>
	);
};

const PanelResizeHandleStyled = styled(PanelResizeHandle)<{
	vertical?: boolean;
}>`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 14px;

	svg {
		${(props) => (props.vertical ? "height: 100%;" : "width: 100%;")}
	}

	${(props) => props.vertical && "transform: rotate(90deg); width: 100%; height: 14px;"}
`;

const Wrapper = styled("div")`
	height: 100vh;
`;

const BG = styled("div")`
	background-color: #f5f5f5;
`;
