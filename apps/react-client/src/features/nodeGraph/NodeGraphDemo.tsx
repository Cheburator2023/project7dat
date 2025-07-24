import { Box, Button, Typography } from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";

import { NodeGraph } from "./NodeGraph";

export function NodeGraphDemo() {
	const { graphs, currentGraph, loadGraph, createGraph } = useDataLineageStore(
		useShallow((state) => ({
			graphs: state.graphs,
			currentGraph: state.currentGraph,
			loadGraph: state.loadGraph,
			createGraph: state.createGraph,
		})),
	);

	const handleLoadFirstGraph = () => {
		if (graphs.length > 0) {
			loadGraph(graphs[0].id);
		}
	};

	const handleCreateSampleGraph = () => {
		const now = new Date().toISOString();
		const sampleGraph = {
			id: "sample-graph",
			name: "Sample Data Lineage",
			description: "A sample data lineage graph for demonstration",
			version: "1.0.0",
			created: now,
			updated: now,
			metadata: {
				author: "demo-user",
				environment: "development" as const,
				tags: ["demo", "sample"],
			},
			nodes: [
				{
					id: "source-1",
					name: "Customer Database",
					type: "source" as const,
					description: "Main customer database",
					metadata: {
						owner: "data-team",
						created: now,
						updated: now,
						tags: ["customer", "database"],
						location: "prod-db-01",
						size: 10737418240, // 10GB in bytes
						rowCount: 1000000,
					},
					position: { x: 100, y: 100 },
					status: "active" as const,
				},
				{
					id: "transform-1",
					name: "Customer ETL",
					type: "transformation" as const,
					description: "ETL process for customer data",
					metadata: {
						owner: "data-team",
						created: now,
						updated: now,
						tags: ["etl", "transformation"],
						location: "airflow-cluster",
						rowCount: 0,
					},
					position: { x: 400, y: 100 },
					status: "active" as const,
				},
				{
					id: "dest-1",
					name: "Customer Warehouse",
					type: "destination" as const,
					description: "Data warehouse for customer analytics",
					metadata: {
						owner: "analytics-team",
						created: now,
						updated: now,
						tags: ["warehouse", "analytics"],
						location: "snowflake-prod",
						size: 5368709120, // 5GB in bytes
						rowCount: 950000,
					},
					position: { x: 700, y: 100 },
					status: "active" as const,
				},
			],
			edges: [
				{
					id: "edge-1",
					sourceId: "source-1",
					targetId: "transform-1",
					type: "data_flow" as const,
					metadata: {
						created: now,
						frequency: "batch" as const,
						lastRun: now,
						status: "active" as const,
					},
				},
				{
					id: "edge-2",
					sourceId: "transform-1",
					targetId: "dest-1",
					type: "data_flow" as const,
					metadata: {
						created: now,
						frequency: "batch" as const,
						lastRun: now,
						status: "active" as const,
					},
				},
			],
		};

		createGraph(sampleGraph);
		loadGraph(sampleGraph.id);
	};

	return (
		<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			<Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
				<Typography variant="h5" gutterBottom>
					Data Lineage Node Graph Demo
				</Typography>
				<Box sx={{ display: "flex", gap: 2 }}>
					<Button
						variant="contained"
						onClick={handleLoadFirstGraph}
						disabled={graphs.length === 0}
					>
						Load First Graph ({graphs.length} available)
					</Button>
					<Button variant="outlined" onClick={handleCreateSampleGraph}>
						Create Sample Graph
					</Button>
				</Box>
				{currentGraph && (
					<Typography variant="body2" sx={{ mt: 1 }}>
						Current: {currentGraph.name} ({currentGraph.nodes.length} nodes,{" "}
						{currentGraph.edges.length} edges)
					</Typography>
				)}
			</Box>
			<Box sx={{ flex: 1 }}>
				<NodeGraph />
			</Box>
		</Box>
	);
}
