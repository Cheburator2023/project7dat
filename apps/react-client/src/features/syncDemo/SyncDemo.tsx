import { Box, Typography, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { NodeGraph } from "@react-client/features/nodeGraph";
import { CodeEditor } from "@react-client/features/codeEditor";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";

const DemoContainer = styled(Box)(({ theme }) => ({
	height: "100vh",
	display: "flex",
	flexDirection: "column",
	padding: theme.spacing(2),
	gap: theme.spacing(2),
}));

const PanelsContainer = styled(Box)({
	display: "flex",
	gap: "16px",
	flex: 1,
	minHeight: 0,
});

const PanelContainer = styled(Paper)(({ theme }) => ({
	flex: 1,
	padding: theme.spacing(2),
	display: "flex",
	flexDirection: "column",
}));

const ContentArea = styled(Box)({
	flex: 1,
	minHeight: 0,
});

export function SyncDemo() {
	const { currentGraph, selectedNodes } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
			selectedNodes: state.selectedNodes,
		})),
	);

	return (
		<DemoContainer>
			<Typography variant="h4" gutterBottom>
				Node Graph & Code Editor Synchronization Demo
			</Typography>
			<Typography variant="body1" color="text.secondary" gutterBottom>
				Click on nodes in the graph to see the corresponding JSON highlighted in
				the editor. Click on JSON properties in the editor to select nodes in
				the graph.
				{selectedNodes.length > 0 && (
					<> Currently selected: {selectedNodes.join(", ")}</>
				)}
			</Typography>

			<PanelsContainer>
				<PanelContainer>
					<Typography variant="h6" gutterBottom>
						Node Graph
					</Typography>
					<ContentArea>
						<NodeGraph />
					</ContentArea>
				</PanelContainer>
				<PanelContainer>
					<Typography variant="h6" gutterBottom>
						Code Editor
					</Typography>
					<ContentArea>
						<CodeEditor readOnly />
					</ContentArea>
				</PanelContainer>
			</PanelsContainer>
		</DemoContainer>
	);
}
