import { useEffect } from "react";
import { useSearchParams, useLocation } from "react-router";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { IJsonModel } from "flexlayout-react";
import { useShallow } from "zustand/react/shallow";

import {
	EntitiesPanel,
	DashboardHeader,
} from "@react-client/features/entities/organisms";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";
import { useEntitiesStore } from "@react-client/features/entities/stores";

export const flexLayoutJson: IJsonModel = {
	global: {
		tabEnableClose: false,
		tabEnableRename: false,
		tabSetEnableTabStrip: true,
		tabSetEnableDrop: true,
		tabSetEnableDrag: true,
		tabSetEnableClose: false,
		tabSetEnableMaximize: true,
	},
	borders: [],
	layout: {
		type: "row",
		weight: 100,
		children: [
			{
				type: "row",
				weight: 100,
				children: [
					{
						type: "tabset",
						weight: 100,
						children: [
							{
								type: "tab",
								name: "📊 Сущности",
								component: "entities",
								id: "entities-tab",
							},
						],
					},
				],
			},
		],
	},
};

export const ObjectsPage = () => {
	const [, setSearchParams] = useSearchParams();
	const { selectEntityWithAttribute, setZoomToNode } = useEntitiesStore(
		useShallow((state) => ({
			selectEntityWithAttribute: state.selectEntityWithAttribute,
			setZoomToNode: state.setZoomToNode,
		})),
	);
	useCurrentDataLineageGraph();

	const location = useLocation();

	// Parse URL params for entity/attribute highlighting on navigation from entity page
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const entityId = params.get("entityId");
		const attrName = params.get("attrName");

		if (entityId && attrName) {
			// Use atomic method to set both entity and attribute together
			selectEntityWithAttribute(entityId, attrName);
			setZoomToNode(entityId);

			// Clear URL params after processing
			setSearchParams({}, { replace: true });
		}
	}, [
		location.search,
		setSearchParams,
		selectEntityWithAttribute,
		setZoomToNode,
	]);

	return (
		<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			<DashboardHeader />

			<FlexLayoutWrapper>
				<EntitiesPanel />
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
		backgroundColor: theme.vars?.palette?.background.paper,
	},
	"& .flexlayout__splitter": {
		backgroundColor: "transparent",
		borderRadius: "8px",
		width: "4px !important",
		minWidth: "4px !important",
	},
	"& .flexlayout__splitter.flexlayout__splitter_vert": {
		backgroundColor: "transparent",
		height: "4px !important",
		minHeight: "4px !important",
		width: "inherit !important",
		minWidth: "inherit !important",
	},
	"& .flexlayout__splitter_vert": {
		margin: "0 2px",
	},
	"& .flexlayout__splitter_horz": {
		margin: "2px 0",
	},
	"& .flexlayout__tab_button_content": {
		padding: "4px 9px",
		borderRadius: "8px",
		fontSize: "10px",
		backgroundColor: "#488ecb1a",
	},
}));
