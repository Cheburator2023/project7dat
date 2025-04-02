import { useColorScheme } from "@mui/material";
import {
	type CSSProperties,
	type ComponentProps,
	memo,
	useCallback,
	useMemo,
} from "react";
import { type GetMiniMapNodeAttribute, MiniMap } from "reactflow";
import { useGlobalSettingsStore } from "../../../../common/store/globalSettingsStore";
import { NodeType } from "../../store/json-engine/enums/node-type.enum";
import type {
	ArrayNodeData,
	ObjectNodeData,
	PrimitiveNodeData,
} from "../../store/json-engine/types/sea-node.type";

type MinimapTheme = {
	backgroundColor: CSSProperties["backgroundColor"];
	maskColor: ComponentProps<typeof MiniMap>["maskColor"];
};

const _CustomMiniMap = () => {
	const { mode, systemMode, setMode } = useColorScheme();

	const isDarkMode = mode === "dark";

	const nodeClassName: GetMiniMapNodeAttribute<
		ObjectNodeData | ArrayNodeData | PrimitiveNodeData
	> = useCallback((node) => {
		const nodeTypeToClassNameMap: Record<NodeType, string> = {
			[NodeType.Object]: "object-node",
			[NodeType.Array]: "array-node",
			[NodeType.Primitive]: "primitive-node",
		};

		return nodeTypeToClassNameMap[node.type as NodeType];
	}, []);

	const minimapTheme = useMemo(() => {
		const lightMinimapTheme: MinimapTheme = {
			backgroundColor: "#ffffff", // backgroundContrast
			maskColor: undefined,
		};
		const darkMinimapTheme: MinimapTheme = {
			backgroundColor: "#16181A", // backgroundContrast
			maskColor: "rgba(15, 15, 15, 0.7)",
		};

		return isDarkMode ? darkMinimapTheme : lightMinimapTheme;
	}, [isDarkMode]);

	const store = useGlobalSettingsStore();

	return (
		store.isMinimapVisible && (
			<MiniMap
				style={{
					backgroundColor: minimapTheme.backgroundColor,
					margin: "0 0 8px 8px",
				}}
				maskColor={minimapTheme.maskColor}
				position="bottom-left"
				pannable
				zoomable
				nodeClassName={nodeClassName}
			/>
		)
	);
};

export const CustomMiniMap = memo(_CustomMiniMap);
