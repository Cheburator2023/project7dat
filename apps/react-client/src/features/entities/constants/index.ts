// ============================================================================
// Graph Constants
// ============================================================================

import {
	Orientation,
	SerializedDockview,
} from "@react-client/features/dockview/core";

export const NODE_WIDTH = 320;
export const NODE_HEADER_HEIGHT = 60;
export const ATTR_ROW_HEIGHT = 22;
export const MAX_VISIBLE_ATTRS = 50;

// ============================================================================
// Color Constants
// ============================================================================

export const TYPE_COLORS: Record<
	string,
	{ bg: string; border: string; text: string }
> = {
	table: { bg: "#e3f2fd", border: "#1976d2", text: "#1565c0" },
	model: { bg: "#e3f2fd", border: "#1976d2", text: "#1565c0" },
	view: { bg: "#f3e5f5", border: "#7b1fa2", text: "#6a1b9a" },
	rdd: { bg: "#fff3e0", border: "#f57c00", text: "#e65100" },
	unresolved: { bg: "#fce4ec", border: "#c2185b", text: "#ad1457" },
};

export const HIGHLIGHT_COLORS = {
	selected: "#ffc107",
	upstream: "#4caf50",
	downstream: "#2196f3",
	searchMatch: "#ff5722", // Orange for search matches
} as const;

export const TEMP_TABLE_COLORS = {
	bg: "#fff8e1",
	border: "#ff8f00",
	text: "#e65100",
	badge: "#ff6f00",
} as const;

export const isTempTable = (entity: {
	id?: string;
	name?: string | null;
	namespace?: string | null;
}): boolean => {
	const id = entity.id ?? "";
	const name = entity.name ?? "";
	const namespace = entity.namespace ?? "";

	return (
		id.includes("TEMP") ||
		id.includes("TMP") ||
		name.includes("TEMP") ||
		name.includes("TMP") ||
		namespace.includes("TMP") ||
		namespace.includes("TEMP")
	);
};

export const DEPTH_LEVEL_COLORS = [
	{
		bg: "rgba(255, 193, 7, 0.08)",
		border: "rgba(255, 193, 7, 0.3)",
		label: "#f9a825",
	},
	{
		bg: "rgba(76, 175, 80, 0.08)",
		border: "rgba(76, 175, 80, 0.3)",
		label: "#388e3c",
	},
	{
		bg: "rgba(33, 150, 243, 0.08)",
		border: "rgba(33, 150, 243, 0.3)",
		label: "#1976d2",
	},
	{
		bg: "rgba(156, 39, 176, 0.08)",
		border: "rgba(156, 39, 176, 0.3)",
		label: "#7b1fa2",
	},
	{
		bg: "rgba(0, 188, 212, 0.08)",
		border: "rgba(0, 188, 212, 0.3)",
		label: "#00838f",
	},
	{
		bg: "rgba(255, 87, 34, 0.08)",
		border: "rgba(255, 87, 34, 0.3)",
		label: "#d84315",
	},
	{
		bg: "rgba(233, 30, 99, 0.08)",
		border: "rgba(233, 30, 99, 0.3)",
		label: "#c2185b",
	},
	{
		bg: "rgba(63, 81, 181, 0.08)",
		border: "rgba(63, 81, 181, 0.3)",
		label: "#283593",
	},
] as const;

export const ATTR_EDGE_COLORS = [
	"#2196f3",
	"#4caf50",
	"#ff9800",
	"#9c27b0",
	"#00bcd4",
	"#e91e63",
];

// ============================================================================
// Dockview Layout Configuration
// ============================================================================

export const dockviewLayoutJson: SerializedDockview = {
	grid: {
		root: {
			type: "branch",
			data: [
				// Left column (35%): Entities + Objects
				{
					type: "branch",
					size: 35,
					data: [
						// Top-left: Entities + Selection Info
						{
							type: "leaf",
							size: 50,
							data: {
								id: "group-left-top",
								activeView: "entities-tab",
								views: ["entities-tab", "selection-info-tab"],
							},
						},
						// Bottom-left: Objects
						{
							type: "leaf",
							size: 50,
							data: {
								id: "group-left-bottom",
								activeView: "objects-tab",
								views: ["objects-tab"],
							},
						},
					],
				},
				// Middle column (65%): Graph + Issues + Schema
				{
					type: "leaf",
					size: 65,
					data: {
						id: "group-center",
						activeView: "graph-tab",
						views: ["graph-tab", "issues-tab", "schema-tab"],
					},
				},
			],
		},
		height: 800,
		width: 1200,
		orientation: Orientation.HORIZONTAL,
	},
	panels: {
		"entities-tab": {
			id: "entities-tab",
			contentComponent: "entities",
			title: "📊 Сущности",
		},
		"selection-info-tab": {
			id: "selection-info-tab",
			contentComponent: "selection-info",
			title: "ℹ️ Информация",
		},
		"objects-tab": {
			id: "objects-tab",
			contentComponent: "objects",
			title: "📋 Объекты",
		},
		"graph-tab": {
			id: "graph-tab",
			contentComponent: "graph",
			title: "🔗 Граф",
		},
		"issues-tab": {
			id: "issues-tab",
			contentComponent: "issues",
			title: "⚠️ Ошибки",
		},
		"schema-tab": {
			id: "schema-tab",
			contentComponent: "schema",
			title: "📋 Схема",
		},
	},
	activeGroup: "group-center",
};
