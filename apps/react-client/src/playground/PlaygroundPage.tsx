import { useState, useCallback } from "react";
import { Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { DashboardPage } from "@react-client/features/dashboard/DashboardPage";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useInitializeJsonGraph } from "@react-client/api/hooks";
import { dataLineageExampleData } from "@react-client/examples/dataLineageExampleData";
import type { DataLineageGraph } from "@react-client/types/dataLineage";

const _data: any = [
	{
		name: "Dashboard2",
		Component: () => (
			<div style={{ zoom: 0.8 }}>
				<DashboardPage />
			</div>
		),
	},
];

export const PlaygroundPage = () => {
	const [isInitializing, setIsInitializing] = useState(false);
	const initializeGraphMutation = useInitializeJsonGraph();
	const { initializeGraph, setCurrentGraphId } = useDataLineageStore();

	const handleInitializeGraph = useCallback(async () => {
		setIsInitializing(true);
		try {
			const result = await initializeGraphMutation.mutateAsync({
				data: dataLineageExampleData,
			});
			initializeGraph(result.data as DataLineageGraph);
			setCurrentGraphId(result.id);
			setTimeout(() => {
				setIsInitializing(false);
			}, 100);
		} catch (error) {
			console.error("Failed to initialize graph:", error);
			setIsInitializing(false);
		}
	}, [initializeGraphMutation, initializeGraph, setCurrentGraphId]);

	return (
		<div>
			<Header>
				<Button
					variant="outlined"
					size="small"
					startIcon={<AddIcon />}
					onClick={handleInitializeGraph}
					disabled={isInitializing}
					title="Инициализация графа"
				>
					{isInitializing ? "Инициализация..." : "Новый JSON"}
				</Button>
			</Header>
			<Flex flexDirection="column" gap={8}>
				{_data?.map((item: any) => (
					<Card key={item.name}>
						<item.Component />
					</Card>
				))}
			</Flex>
		</div>
	);
};
