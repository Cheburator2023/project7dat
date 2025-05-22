import CommitIcon from "@mui/icons-material/Commit";
import DataObjectIcon from "@mui/icons-material/DataObject";
import PolylineIcon from "@mui/icons-material/Polyline";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { IconButton, styled } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { useGlobalSettingsStore } from "@react-client/common/store/globalSettingsStore";
export const BottomBar = () => {
	const {
		toggleCommitHistory,
		toggleDataMart,
		toggleJsonPreview,
		toggleHideAllDashboardPanels,
		isCommitHistoryVisible,
		isDataMartVisible,
		isJsonPreviewVisible,
	} = useGlobalSettingsStore();

	return (
		<Wrapper>
			<Card padding="4px 12px">
				<IconButton
					onClick={toggleJsonPreview}
					color={isJsonPreviewVisible ? "inherit" : undefined}
				>
					<DataObjectIcon />
				</IconButton>
				<IconButton
					onClick={toggleDataMart}
					color={isDataMartVisible ? "inherit" : undefined}
				>
					<ShoppingCartIcon />
				</IconButton>
				<IconButton
					onClick={toggleCommitHistory}
					color={isCommitHistoryVisible ? "inherit" : undefined}
				>
					<CommitIcon />
				</IconButton>
				<IconButton
					onClick={toggleHideAllDashboardPanels}
					disabled={
						!(
							isCommitHistoryVisible ||
							isJsonPreviewVisible ||
							isDataMartVisible
						)
					}
				>
					<PolylineIcon />
				</IconButton>
			</Card>
		</Wrapper>
	);
};

const Wrapper = styled(Flex)`
  position: fixed;
  width: 100vw;
  display: flex;
  justify-content: center;
  bottom: 0;
  padding-bottom: 10px;
  z-index: 999;
`;
