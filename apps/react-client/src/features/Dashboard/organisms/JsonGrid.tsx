import { Card } from "@mui/material";
import { styled } from "@mui/system";
import { Rnd } from "react-rnd";

import { Flex } from "../../../common/primitives/Flex";
import { useGlobalSettingsStore } from "../../../common/store/globalSettingsStore";
import { JsonDiagram } from "../../jsonNodeEditor/json-diagram/components/JsonDiagram";
import { JsonEditor } from "../../jsonNodeEditor/json-editor/components/JsonEditor";

const screenWidth = window.innerWidth;
const cardwidth = 500;

const defaultSize = {
	x: screenWidth - cardwidth - 100,
	y: 100,
	width: cardwidth,
	height: 666,
};

export function JsonGrid() {
	const store = useGlobalSettingsStore();

	return (
		<Flex width="100%" height="100vh">
			{store.isJsonPreviewVisible && (
				<StyledFlex
					position="absolute"
					zIndex={2}
					top={0}
					left={0}
					width="100%"
					height="100%"
					pointerEvents="none"
				>
					<Rnd
						default={defaultSize}
						minWidth={cardwidth}
						minHeight={190}
						bounds="window"
					>
						<Card
							variant="outlined"
							sx={{ width: "100%", height: "100%" }}
							elevation={1}
						>
							<JsonEditor />
						</Card>
					</Rnd>
				</StyledFlex>
			)}
			<Flex position="relative" zIndex={1} width="100%" height="100%">
				<JsonDiagram />
			</Flex>
			{/* <NodeDetailPanel /> */}
		</Flex>
	);
}

const StyledFlex = styled(Flex)`
	& div.react-draggable {
		pointer-events: all;
	}
`;
