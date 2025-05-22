import { Graph } from "@react-client/features/json4u/containers/editor/graph/Graph";
import { initLogger } from "@react-client/features/json4u/lib/utils";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { LeftPanel } from "./LeftPanel";

initLogger();

export function MainPanel() {
	const {
		rightPanelSize,
		rightPanelCollapsed,
		viewMode,
		setViewMode,
		setRightPanelSize,
		setRightPanelCollapsed,
	} = useStatusStore();

	const location = useLocation();

	useEffect(() => {
		if (location.pathname.includes(viewMode)) {
			setViewMode(viewMode);
		}
	}, [location.pathname]);

	// see https://github.com/bvaughn/react-resizable-panels/issues/128#issuecomment-1523343548
	return (
		<>
			<LeftPanel />
			<Graph />

			{/* <ModePanel /> */}
			{/* <StatusBar /> */}
		</>
	);
}

function useObserveResize() {
	const { setLeftPanelWidth, setRightPanelWidth } = useStatusStore(
		useShallow((state) => ({
			setLeftPanelWidth: state.setLeftPanelWidth,
			setRightPanelWidth: state.setRightPanelWidth,
		})),
	);
}
