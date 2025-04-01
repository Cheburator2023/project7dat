import { Card } from "@mui/material";
import { Rnd } from "react-rnd";
import { Flex } from "../../../common/primitives/Flex";
import { JsonDiagram } from "../../JsonNodeEditor/json-diagram/components/JsonDiagram";
import { JsonEditor } from "../../JsonNodeEditor/json-editor/components/JsonEditor";
// import { dia } from "@joint/plus";

// import { NodeDetailPanel } from "../../node-detail/components/NodeDetailPanel";

export function MainGrid() {
	return (
		<Flex width="100%" height="calc(100vh - 3.375rem)">
			<Flex
				position="absolute"
				zIndex={2}
				top={0}
				left={0}
				width="100%"
				height="100%"
			>
				<Rnd
					default={{
						x: 100,
						y: 100,
						width: 200,
						height: 190,
					}}
					minWidth={200}
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
			</Flex>

			<Flex position="relative" zIndex={1} width={"100%"} height="100%">
				<JsonDiagram />
			</Flex>
			{/* <NodeDetailPanel /> */}
		</Flex>
	);
}
