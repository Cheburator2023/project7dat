import { Box, Typography, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { NodeGraph } from "@react-client/features/nodeGraph";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";
import { useRef } from "react";
import { CodeJsonEditor } from "@react-client/features/codeEditor/CodeJsonEditor";
import { DataMart } from "@react-client/features/dataMart/DataMart";

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
	minWidth: 0,
}));

const ContentArea = styled(Box)({
	flex: 1,
	minHeight: 0,
});

export function SyncDemo() {
	const editorRef = useRef<React.ElementRef<typeof CodeJsonEditor>>(null);

	const { currentGraph, selectedNodes, setCurrentGraph } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
			selectedNodes: state.selectedNodes,
			setCurrentGraph: state.setCurrentGraph,
		})),
	);

	const handleJsonChange = (data: any) => {
		console.log("JSON данные изменены:", data);
		// Обновляем граф в store только если это действительно граф
		if (data && typeof data === "object" && data.nodes && data.edges) {
			setCurrentGraph(data);
		}
	};

	return (
		<DemoContainer>
			<Typography variant="h4" gutterBottom>
				Демо синхронизации графа узлов, JSON-просмотрщика и датамарта
			</Typography>
			<Typography variant="body1" color="text.secondary" gutterBottom>
				Кликните на узлы в графе, чтобы увидеть соответствующий JSON,
				подсвеченный в просмотрщике. Кликните на строки в датамарте или свойства
				JSON в просмотрщике, чтобы выбрать узлы в графе.
				{selectedNodes.length > 0 && <> Выбрано: {selectedNodes.join(", ")}</>}
			</Typography>

			<PanelsContainer>
				<PanelContainer>
					<Typography variant="h6" gutterBottom>
						Граф узлов
					</Typography>
					<ContentArea>
						<NodeGraph />
					</ContentArea>
				</PanelContainer>
				<PanelContainer>
					<Typography variant="h6" gutterBottom>
						JSON просмотрщик
					</Typography>
					<ContentArea>
						<CodeJsonEditor
							ref={editorRef}
							initialData={currentGraph}
							onChange={handleJsonChange}
						/>
					</ContentArea>
				</PanelContainer>
			</PanelsContainer>

			<PanelContainer>
				<Typography variant="h6" gutterBottom>
					Датамарт
				</Typography>
				<ContentArea>
					<DataMart />
				</ContentArea>
			</PanelContainer>
		</DemoContainer>
	);
}
