import {
	Orientation,
	type SerializedDockview,
} from "@react-client/features/dockview/core";

export const commitMergeLayoutJson: SerializedDockview = {
	grid: {
		root: {
			type: "branch",
			data: [
				// Left column (30%): Entities + Objects
				{
					type: "branch",
					size: 30,
					data: [
						{
							type: "leaf",
							size: 50,
							data: {
								id: "group-left-top",
								activeView: "commit-entities-tab",
								views: [
									"commit-entities-tab",
									"commit-entities-comparison-tab",
								],
							},
						},
						{
							type: "leaf",
							size: 50,
							data: {
								id: "group-left-bottom",
								activeView: "commit-objects-tab",
								views: ["commit-objects-tab"],
							},
						},
					],
				},
				// Center column (50%): Graph
				{
					type: "leaf",
					size: 50,
					data: {
						id: "group-center",
						activeView: "commit-graph-tab",
						views: ["commit-graph-tab"],
					},
				},
				// Right column (20%): Summary + Actions
				{
					type: "branch",
					size: 20,
					data: [
						{
							type: "leaf",
							size: 65,
							data: {
								id: "group-right-top",
								activeView: "commit-summary-tab",
								views: ["commit-summary-tab"],
							},
						},
						{
							type: "leaf",
							size: 35,
							data: {
								id: "group-right-bottom",
								activeView: "commit-actions-tab",
								views: ["commit-actions-tab"],
							},
						},
					],
				},
			],
		},
		height: 800,
		width: 1200,
		orientation: Orientation.HORIZONTAL,
	},
	panels: {
		"commit-entities-tab": {
			id: "commit-entities-tab",
			contentComponent: "commit-entities",
			title: "📊 Сущности коммита",
		},
		"commit-entities-comparison-tab": {
			id: "commit-entities-comparison-tab",
			contentComponent: "commit-entities-comparison",
			title: "🔄 Сравнение с текущими",
		},
		"commit-objects-tab": {
			id: "commit-objects-tab",
			contentComponent: "commit-objects",
			title: "📋 Объекты и связи",
		},
		"commit-graph-tab": {
			id: "commit-graph-tab",
			contentComponent: "commit-graph",
			title: "🔗 Граф изменений",
		},
		"commit-summary-tab": {
			id: "commit-summary-tab",
			contentComponent: "commit-summary",
			title: "📈 Обзор изменений",
		},
		"commit-actions-tab": {
			id: "commit-actions-tab",
			contentComponent: "commit-actions",
			title: "⚡ Применение",
		},
	},
	activeGroup: "group-center",
};
