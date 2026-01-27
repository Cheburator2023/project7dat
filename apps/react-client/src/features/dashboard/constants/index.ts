import type { IJsonModel } from "flexlayout-react";

// ============================================================================
// Graph Constants
// ============================================================================

export const NODE_WIDTH = 280;
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

export const ATTR_EDGE_COLORS = [
	"#2196f3",
	"#4caf50",
	"#ff9800",
	"#9c27b0",
	"#00bcd4",
	"#e91e63",
];

// ============================================================================
// FlexLayout Configuration
// ============================================================================

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
			// Left column: Tables
			{
				type: "row",
				weight: 35,
				children: [
					{
						type: "tabset",
						weight: 50,
						children: [
							{
								type: "tab",
								name: "📊 Сущности",
								component: "entities",
								id: "entities-tab",
							},
							{
								type: "tab",
								name: "ℹ️ Информация",
								component: "selection-info",
								id: "selection-info-tab",
							},
						],
					},
					{
						type: "tabset",
						weight: 50,
						children: [
							{
								type: "tab",
								name: "📋 Объекты",
								component: "objects",
								id: "objects-tab",
							},
						],
					},
				],
			},
			// Middle column: Graph
			{
				type: "tabset",
				weight: 40,
				children: [
					{
						type: "tab",
						name: "🔗 Граф",
						component: "graph",
						id: "graph-tab",
					},
					{
						type: "tab",
						name: "⚠️ Ошибки",
						component: "issues",
						id: "issues-tab",
					},
					{
						type: "tab",
						name: "📋 Схема",
						component: "schema",
						id: "schema-tab",
					},
				],
			},
			// Right column: Code Editor, Commit History, Info
			{
				type: "row",
				weight: 25,
				children: [
					{
						type: "tabset",
						weight: 50,
						children: [
							// {
							// 	type: "tab",
							// 	name: "✏️ Редактор",
							// 	component: "code-editor",
							// 	id: "code-editor-tab",
							// },
							//
							// {
							// 	type: "tab",
							// 	name: "⚠️ Ошибки",
							// 	component: "issues",
							// 	id: "issues-tab",
							// },
							// {
							// 	type: "tab",
							// 	name: "📋 Схема",
							// 	component: "schema",
							// 	id: "schema-tab",
							// },
						],
					},
					// {
					// 	type: "tabset",
					// 	weight: 50,
					// 	children: [
					// 		{
					// 			type: "tab",
					// 			name: "📜 История",
					// 			component: "commit-history",
					// 			id: "commit-history-tab",
					// 		},
					// 	],
					// },
				],
			},
		],
	},
};
