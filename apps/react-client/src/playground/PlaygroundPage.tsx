import { useState, useCallback } from "react";
import { Button } from "@mui/material";
import {
	Add as AddIcon,
	RestartAlt as RestartAltIcon,
} from "@mui/icons-material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import {
	useInitializeJsonGraph,
	useResetDatabase,
} from "@react-client/api/hooks";
import type { DataLineageGraph } from "@react-client/types/dataLineage";

const _data: any = [
	{
		name: "Dashboard2",
		Component: () => (
			<div style={{ zoom: 0.8 }}>
				<div />
			</div>
		),
	},
];

export const PlaygroundPage = () => {
	const [isInitializing, setIsInitializing] = useState(false);
	const [isResetting, setIsResetting] = useState(false);
	const initializeGraphMutation = useInitializeJsonGraph();
	const resetDatabaseMutation = useResetDatabase();
	const { initializeGraph, setCurrentGraphId } = useDataLineageStore();

	const handleInitializeGraph = useCallback(async () => {
		setIsInitializing(true);
		try {
			const result = await initializeGraphMutation.mutateAsync({
				data: {} as any,
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

	const handleResetDatabase = useCallback(async () => {
		if (
			!window.confirm(
				"Вы уверены, что хотите сбросить все данные? Это действие необратимо!",
			)
		) {
			return;
		}
		setIsResetting(true);
		try {
			const result = await resetDatabaseMutation.mutateAsync();
			console.log("Database reset result:", result);
			setCurrentGraphId(null as unknown as string);
		} catch (error) {
			console.error("Failed to reset database:", error);
		} finally {
			setIsResetting(false);
		}
	}, [resetDatabaseMutation, setCurrentGraphId]);

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
				<Button
					variant="outlined"
					size="small"
					color="error"
					startIcon={<RestartAltIcon />}
					onClick={handleResetDatabase}
					disabled={isResetting}
					title="Сбросить все данные базы"
				>
					{isResetting ? "Сброс..." : "Сбросить БД"}
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
