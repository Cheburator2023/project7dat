import { Box, Button, Typography } from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import {
	useDataLineageGraphs,
	useCreateDataLineageGraph,
} from "@react-client/hooks/api";
import { useShallow } from "zustand/react/shallow";

import { NodeGraph } from "./NodeGraph";

export function NodeGraphDemo() {
	const { data: graphs = [] } = useDataLineageGraphs();
	const createGraphMutation = useCreateDataLineageGraph();

	const { currentGraph, setCurrentGraph } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
			setCurrentGraph: state.setCurrentGraph,
		})),
	);

	const handleLoadFirstGraph = () => {
		if (graphs.length > 0) {
			setCurrentGraph(graphs[0]);
		}
	};

	const handleCreateSampleGraph = () => {
		const _now = new Date().toISOString();
		const sampleGraph = {
			desc: {
				appId: "sample-app",
				appName: "Sample Data Lineage",
			},
			entities: [
				{
					id: "source-1",
					modified: false,
					type: "table" as const,
					namespace: "prod",
					name: "Customer Database",
					attrSeq: [
						{ name: "id", type: "string" },
						{ name: "name", type: "string" },
						{ name: "email", type: "string" },
					],
				},
				{
					id: "transform-1",
					modified: false,
					type: "view" as const,
					namespace: "airflow",
					name: "Customer ETL",
					attrSeq: [
						{ name: "customer_id", type: "string" },
						{ name: "customer_name", type: "string" },
						{ name: "processed_date", type: "string" },
					],
				},
				{
					id: "dest-1",
					modified: false,
					type: "table" as const,
					namespace: "warehouse",
					name: "Customer Warehouse",
					attrSeq: [
						{ name: "id", type: "string" },
						{ name: "name", type: "string" },
						{ name: "created_at", type: "string" },
					],
				},
			],
			mappings: [
				{
					id: 1,
					entityId: "transform-1",
					deps: [
						{
							entityId: "source-1",
							attrMaps: [
								{ src: "id", dst: "customer_id" },
								{ src: "name", dst: "customer_name" },
							],
						},
					],
				},
				{
					id: 2,
					entityId: "dest-1",
					deps: [
						{
							entityId: "transform-1",
							attrMaps: [
								{ src: "customer_id", dst: "id" },
								{ src: "customer_name", dst: "name" },
							],
						},
					],
				},
			],
		};

		createGraphMutation.mutate(sampleGraph, {
			onSuccess: (createdGraph: any) => {
				setCurrentGraph(createdGraph.data);
			},
		});
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
						Current: {currentGraph.desc.appName} ({currentGraph.entities.length}{" "}
						entities, {currentGraph.mappings.length} mappings)
					</Typography>
				)}
			</Box>
			<Box sx={{ flex: 1 }}>
				<NodeGraph />
			</Box>
		</Box>
	);
}
