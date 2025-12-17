import { useState, useCallback, useRef } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
	Layout,
	Model,
	TabNode,
	Action,
	DockLocation,
	Actions,
} from "flexlayout-react";
import HomeIcon from "@mui/icons-material/Home";
import { useNavigate } from "react-router";

// Dashboard panels
import {
	EntitiesPanel,
	ObjectsPanel,
	GraphPanel,
	CodeEditorPanel,
	SelectionInfoPanel,
	IssuesPanel,
	SchemaPanel,
} from "@react-client/features/dashboard/organisms";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";

// Local components
import {
	AgChartsPanel,
	PanelsSidebar,
	BuilderModal,
	EmptyState,
} from "./components";
import type { LayoutPreset, BuilderMode, PanelDefinition } from "./types";

const EMPTY_LAYOUT = {
	global: {
		tabEnableClose: true,
		tabEnableRename: false,
		tabSetEnableTabStrip: true,
		tabSetEnableDrop: true,
		tabSetEnableDrag: true,
		tabSetEnableClose: true,
		tabSetEnableMaximize: true,
	},
	borders: [],
	layout: {
		type: "row" as const,
		weight: 100,
		children: [
			{
				type: "tabset" as const,
				weight: 100,
				children: [],
			},
		],
	},
};

export const DashboardBuilderPage = () => {
	const navigate = useNavigate();
	const [mode, setMode] = useState<BuilderMode>("empty");
	const [modalOpen, setModalOpen] = useState(false);
	const [model, setModel] = useState<Model | null>(null);
	const layoutRef = useRef<Layout>(null);
	const [, setDraggedPanel] = useState<PanelDefinition | null>(null);

	const handleOpenModal = () => {
		setModalOpen(true);
	};

	const handleCloseModal = () => {
		setModalOpen(false);
	};

	const handleSelectCustom = () => {
		setMode("custom");
		setModel(Model.fromJson(EMPTY_LAYOUT));
	};

	const handleSelectPreset = (preset: LayoutPreset) => {
		setMode("preset");
		setModel(Model.fromJson(preset.layout));
	};

	const factory = useCallback((node: TabNode) => {
		const component = node.getComponent();

		switch (component) {
			case "entities":
				return <EntitiesPanel />;
			case "objects":
				return <ObjectsPanel />;
			case "graph":
				return <GraphPanel />;
			case "selection-info":
				return <SelectionInfoPanel />;
			case "code-editor":
				return <CodeEditorPanel />;
			case "commit-history":
				return <CommitHistory />;
			case "issues":
				return <IssuesPanel />;
			case "schema":
				return <SchemaPanel />;
			case "ag-charts":
				return <AgChartsPanel />;
			default:
				return <div>Unknown component: {component}</div>;
		}
	}, []);

	const onAction = useCallback((action: Action) => {
		return action;
	}, []);

	const handleDragStart = (panel: PanelDefinition) => {
		setDraggedPanel(panel);
	};

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			if (!model || !layoutRef.current) return;

			const panelData = e.dataTransfer.getData("panel");
			if (!panelData) return;

			const panel: PanelDefinition = JSON.parse(panelData);

			// Add tab to the first available tabset
			const root = model.getRoot();
			const firstTabSet = root.getChildren()[0];

			if (firstTabSet) {
				model.doAction(
					Actions.addNode(
						{
							type: "tab",
							name: `${panel.icon} ${panel.name}`,
							component: panel.component,
							id: `${panel.id}-${Date.now()}`,
						},
						firstTabSet.getId(),
						DockLocation.CENTER,
						-1,
					),
				);
			}

			setDraggedPanel(null);
		},
		[model],
	);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	return (
		<PageContainer>
			<Header>
				<Tooltip title="На главную" arrow>
					<IconButton onClick={() => navigate("/")} size="small">
						<HomeIcon />
					</IconButton>
				</Tooltip>
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					Конструктор дашборда
				</Typography>
			</Header>

			<ContentArea>
				{mode === "empty" && <EmptyState onAddClick={handleOpenModal} />}

				{(mode === "custom" || mode === "preset") && model && (
					<>
						<LayoutArea onDrop={handleDrop} onDragOver={handleDragOver}>
							<FlexLayoutWrapper>
								<Layout
									ref={layoutRef}
									model={model}
									factory={factory}
									onAction={onAction}
									realtimeResize
								/>
							</FlexLayoutWrapper>
						</LayoutArea>

						{mode === "custom" && (
							<PanelsSidebar onDragStart={handleDragStart} />
						)}
					</>
				)}
			</ContentArea>

			<BuilderModal
				open={modalOpen}
				onClose={handleCloseModal}
				onSelectCustom={handleSelectCustom}
				onSelectPreset={handleSelectPreset}
			/>
		</PageContainer>
	);
};

const PageContainer = styled(Box)({
	height: "100vh",
	display: "flex",
	flexDirection: "column",
});

const Header = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(2),
	padding: theme.spacing(1.5, 2),
	borderBottom: `1px solid ${theme.palette.divider}`,
	backgroundColor: theme.palette.background.paper,
}));

const ContentArea = styled(Box)({
	flex: 1,
	display: "flex",
	overflow: "hidden",
});

const LayoutArea = styled(Box)({
	flex: 1,
	position: "relative",
	display: "flex",
});

const FlexLayoutWrapper = styled("div")(({ theme }) => ({
	flex: 1,
	position: "relative",
	"& .flexlayout__layout": {
		backgroundColor: "transparent",
	},
	"& .flexlayout__tab": {
		backgroundColor: theme.vars?.palette?.background.paper,
		color: theme.vars?.palette?.text.primary,
		borderColor: theme.vars?.palette?.divider,
		borderRadius: "8px",
	},
	"& .flexlayout__tabset_header": {
		backgroundColor: theme.vars?.palette?.background.paper,
		borderColor: theme.vars?.palette?.divider,
	},
	"& .flexlayout__tab_button": {
		backgroundColor: "transparent",
		color: theme.vars?.palette?.text.secondary,
		border: "none",
		padding: "5px 0",
		"&:hover": {
			backgroundColor: theme.vars?.palette?.action.hover,
			color: theme.vars?.palette?.text.primary,
		},
	},
	"& .flexlayout__tabset_tabbar_outer": {
		backgroundColor: theme.vars?.palette?.background.paper,
		borderBottom: "1px solid rgb(83 83 83 / 30%)",
	},
	"& .flexlayout__tab_button_selected": {
		backgroundColor: theme.vars?.palette?.action.selected,
		color: theme.vars?.palette?.primary.main,
		fontWeight: 600,
	},
	"& .flexlayout__tabset_content": {
		backgroundColor: theme.vars?.palette?.background.default,
	},
	"& .flexlayout__tabset": {
		borderRadius: "8px",
		border: "1px solid #a5aaba90",
		margin: "4px",
		backgroundColor: theme.vars?.palette?.background.paper,
	},
	"& .flexlayout__splitter": {
		backgroundColor: theme.vars?.palette?.divider,
		borderRadius: "8px",
		width: "4px !important",
		minWidth: "4px !important",
	},
	"& .flexlayout__splitter.flexlayout__splitter_vert": {
		backgroundColor: theme.vars?.palette?.divider,
		height: "4px !important",
		minHeight: "4px !important",
		width: "inherit !important",
		minWidth: "inherit !important",
	},
	"& .flexlayout__splitter_vert": {
		margin: "0 6px",
	},
	"& .flexlayout__splitter_horz": {
		margin: "6px 0",
	},
	"& .flexlayout__tab_button_content": {
		padding: "4px 9px",
		borderRadius: "8px",
		fontSize: "10px",
		backgroundColor: "#488ecb1a",
	},
}));
