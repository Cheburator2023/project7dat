import CommitIcon from "@mui/icons-material/Commit";
import DataObjectIcon from "@mui/icons-material/DataObject";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { IconButton, styled } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { useGlobalSettingsStore } from "@react-client/common/store/globalSettingsStore";

export const BottomBar = () => {
	const { toggleCommitHistory, toggleDataMart, toggleJsonPreview } =
		useGlobalSettingsStore();

	return (
		<Wrapper>
			<Card padding="4px 12px">
				<IconButton onClick={toggleJsonPreview}>
					<DataObjectIcon />
				</IconButton>
				<IconButton onClick={toggleDataMart}>
					<ShoppingCartIcon />
				</IconButton>
				<IconButton onClick={toggleCommitHistory}>
					<CommitIcon />
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
