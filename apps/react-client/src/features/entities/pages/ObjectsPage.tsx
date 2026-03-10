import { useEffect } from "react";
import { useSearchParams, useLocation } from "react-router";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useShallow } from "zustand/react/shallow";

import {
	EntitiesPanel,
	DashboardHeader,
} from "@react-client/features/entities/organisms";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";
import { useEntitiesStore } from "@react-client/features/entities/stores";

export const ObjectsPage = () => {
	const [, setSearchParams] = useSearchParams();
	const { selectEntityWithAttribute, setZoomToNode } = useEntitiesStore(
		useShallow((state) => ({
			selectEntityWithAttribute: state.selectEntityWithAttribute,
			setZoomToNode: state.setZoomToNode,
		})),
	);

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

			<DockviewWrapper>
				<EntitiesPanel />
			</DockviewWrapper>
		</Box>
	);
};

const DockviewWrapper = styled("div")(({ theme }) => ({
	flex: 1,
	position: "relative",
	overflow: "hidden",
}));
