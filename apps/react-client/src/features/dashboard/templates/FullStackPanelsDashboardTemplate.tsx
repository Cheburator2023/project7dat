import { useCallback, useEffect, useRef, type FunctionComponent } from "react";
import { useSearchParams, useLocation } from "react-router";
import { Box, useColorScheme } from "@mui/material";
import { styled } from "@mui/material/styles";

import { DockviewNoCloseTab } from "@react-client/common/dockview/DockviewNoCloseTab";
import { DockviewGroupMaximizeActions } from "@react-client/common/dockview/DockviewGroupMaximizeActions";
import { usePanelSettingsStore } from "@react-client/common/stores/panelSettingsStore";
import { useShallow } from "zustand/react/shallow";

import {
	EntitiesPanel,
	ObjectsPanel,
	GraphPanel,
	SelectionInfoPanel,
	IssuesPanel,
	SchemaPanel,
	DashboardHeader,
} from "../../entities/organisms";
import { dockviewLayoutJson } from "../../entities/constants";

export { useEntitiesStore } from "../../entities/stores";
import { useEntitiesStore } from "../../entities/stores";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";
import {
	DockviewReadyEvent,
	IDockviewPanelProps,
	themeAbyssSpaced,
	themeLightSpaced,
} from "@react-client/features/dockview/core";
import { DockviewReact } from "@react-client/features/dockview/src";
import { RenderWhenVisible } from "@react-client/common/dockview/RenderWnelVisible";

const STORAGE_KEY = "dashboard2-dockview-layout";

const panelComponents: Record<
	string,
	FunctionComponent<IDockviewPanelProps>
> = {
	entities: () => <EntitiesPanel />,
	objects: () => <ObjectsPanel />,
	graph: () => <GraphPanel />,
	"selection-info": () => <SelectionInfoPanel />,
	// "code-editor": () => <CodeEditorPanel />,
	issues: () => <IssuesPanel />,
	schema: RenderWhenVisible(SchemaPanel),
};

export const FullStackPanelsDashboardTemplate = () => {
	const [, setSearchParams] = useSearchParams();
	const { mode } = useColorScheme();

	const { selectEntityWithAttribute, setZoomToNode } = useEntitiesStore(
		useShallow((state) => ({
			selectEntityWithAttribute: state.selectEntityWithAttribute,
			setZoomToNode: state.setZoomToNode,
		})),
	);

	const isPersistEnabled = usePanelSettingsStore((state) =>
		state.isPanelPersistEnabled("dashboard"),
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

	const isPersistEnabledRef = useRef(isPersistEnabled);
	isPersistEnabledRef.current = isPersistEnabled;

	const onReady = useCallback((event: DockviewReadyEvent) => {
		const { api } = event;

		if (isPersistEnabledRef.current) {
			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (saved) {
					api.fromJSON(JSON.parse(saved));
					api.onDidLayoutChange(() => {
						try {
							localStorage.setItem(STORAGE_KEY, JSON.stringify(api.toJSON()));
						} catch (err) {
							console.warn("Failed to save dockview layout:", err);
						}
					});
					return;
				}
			} catch (err) {
				console.warn("Failed to load dockview layout from localStorage:", err);
			}
		}

		api.fromJSON(dockviewLayoutJson);

		if (isPersistEnabledRef.current) {
			api.onDidLayoutChange(() => {
				try {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(api.toJSON()));
				} catch (err) {
					console.warn("Failed to save dockview layout:", err);
				}
			});
		}
	}, []);

	return (
		<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			<DashboardHeader />

			<DockviewWrapper>
				<DockviewReact
					components={panelComponents}
					onReady={onReady}
					defaultRenderer="onlyWhenVisible"
					defaultTabComponent={DockviewNoCloseTab}
					rightHeaderActionsComponent={DockviewGroupMaximizeActions}
					theme={mode === "dark" ? themeAbyssSpaced : themeLightSpaced}
				/>
			</DockviewWrapper>
		</Box>
	);
};

const DockviewWrapper = styled("div")(() => ({
	flex: 1,
	position: "relative",
	overflow: "hidden",
}));
