import { Box, Button, Stack, Typography } from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { CodeEditor } from "./CodeEditor";

export const CodeEditorDemo = () => {
	const { graphs, currentGraph, loadGraph, exportGraph } =
		useDataLineageStore();

	const handleExport = () => {
		const jsonData = exportGraph("json");
		const blob = new Blob([jsonData], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${currentGraph?.name || "data-lineage"}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			<Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
				<Typography variant="h6" gutterBottom>
					Data Lineage JSON Editor
				</Typography>
				<Stack direction="row" spacing={2} alignItems="center">
					<Typography variant="body2">
						Current Graph: {currentGraph?.name || "None"}
					</Typography>
					<Button
						variant="outlined"
						size="small"
						onClick={() => loadGraph(graphs[0]?.id)}
						disabled={!graphs.length}
					>
						Load First Graph
					</Button>
					<Button
						variant="outlined"
						size="small"
						onClick={handleExport}
						disabled={!currentGraph}
					>
						Export JSON
					</Button>
				</Stack>
			</Box>
			<Box sx={{ flex: 1, minHeight: 0 }}>
				<CodeEditor readOnly={false} />
			</Box>
		</Box>
	);
};
