import { useState, useCallback } from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Layout, Model, TabNode, Action } from "flexlayout-react";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";

import {
	EntitiesPanel,
	ObjectsPanel,
	GraphPanel,
	CodeEditorPanel,
	SelectionInfoPanel,
	IssuesPanel,
	SchemaPanel,
	DashboardHeader,
} from "./organisms";
import { flexLayoutJson, PERSIST_LAYOUT_TO_STORAGE } from "./constants";

export { useDashboardStore } from "./stores";

export const DashboardPage = () => {
	const [model] = useState(() => {
		if (PERSIST_LAYOUT_TO_STORAGE) {
			try {
				const savedLayout = localStorage.getItem("dashboard2-flex-layout");
				if (savedLayout) {
					return Model.fromJson(JSON.parse(savedLayout));
				}
			} catch (error) {
				console.warn("Failed to load layout from localStorage:", error);
			}
		}
		return Model.fromJson(flexLayoutJson);
	});

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
			default:
				return <div>Unknown component: {component}</div>;
		}
	}, []);

	const onAction = useCallback(
		(action: Action) => {
			if (PERSIST_LAYOUT_TO_STORAGE) {
				setTimeout(() => {
					try {
						const layoutJson = model.toJson();
						localStorage.setItem(
							"dashboard2-flex-layout",
							JSON.stringify(layoutJson),
						);
					} catch (error) {
						console.warn("Failed to save layout to localStorage:", error);
					}
				}, 0);
			}

			return action;
		},
		[model],
	);

	return (
		<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			<DashboardHeader />

			<FlexLayoutWrapper>
				<Layout
					model={model}
					factory={factory}
					onAction={onAction}
					realtimeResize
				/>
			</FlexLayoutWrapper>
		</Box>
	);
};

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
