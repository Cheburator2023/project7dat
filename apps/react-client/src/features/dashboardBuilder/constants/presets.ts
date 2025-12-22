import type { LayoutPreset } from "../types";

const globalConfig = {
	tabEnableClose: true,
	tabEnableRename: false,
	tabSetEnableTabStrip: true,
	tabSetEnableDrop: true,
	tabSetEnableDrag: true,
	tabSetEnableClose: true,
	tabSetEnableMaximize: true,
};

export const LAYOUT_PRESETS: LayoutPreset[] = [
	{
		id: "single",
		name: "Один таб",
		icon: "⬜",
		description: "Одна панель на весь экран",
		layout: {
			global: globalConfig,
			borders: [],
			layout: {
				type: "row",
				weight: 100,
				children: [
					{
						type: "tabset",
						weight: 100,
						children: [],
					},
				],
			},
		},
	},
	{
		id: "side-by-side",
		name: "Бок о бок",
		icon: "◧",
		description: "Две панели рядом",
		layout: {
			global: globalConfig,
			borders: [],
			layout: {
				type: "row",
				weight: 100,
				children: [
					{
						type: "tabset",
						weight: 50,
						children: [],
					},
					{
						type: "tabset",
						weight: 50,
						children: [],
					},
				],
			},
		},
	},
	{
		id: "top-bottom",
		name: "Сверху-снизу",
		icon: "⬒",
		description: "Две панели друг над другом",
		layout: {
			global: globalConfig,
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
								weight: 50,
								children: [],
							},
							{
								type: "tabset",
								weight: 50,
								children: [],
							},
						],
					},
				],
			},
		},
	},
	{
		id: "grid-2x2",
		name: "Сетка 2x2",
		icon: "⊞",
		description: "Четыре панели в сетке",
		layout: {
			global: globalConfig,
			borders: [],
			layout: {
				type: "row",
				weight: 100,
				children: [
					{
						type: "row",
						weight: 50,
						children: [
							{
								type: "tabset",
								weight: 50,
								children: [],
							},
							{
								type: "tabset",
								weight: 50,
								children: [],
							},
						],
					},
					{
						type: "row",
						weight: 50,
						children: [
							{
								type: "tabset",
								weight: 50,
								children: [],
							},
							{
								type: "tabset",
								weight: 50,
								children: [],
							},
						],
					},
				],
			},
		},
	},
	{
		id: "main-sidebar",
		name: "Основная + боковая",
		icon: "◨",
		description: "Большая панель слева, узкая справа",
		layout: {
			global: globalConfig,
			borders: [],
			layout: {
				type: "row",
				weight: 100,
				children: [
					{
						type: "tabset",
						weight: 70,
						children: [],
					},
					{
						type: "tabset",
						weight: 30,
						children: [],
					},
				],
			},
		},
	},
	{
		id: "three-columns",
		name: "Три колонки",
		icon: "☰",
		description: "Три равные колонки",
		layout: {
			global: globalConfig,
			borders: [],
			layout: {
				type: "row",
				weight: 100,
				children: [
					{
						type: "tabset",
						weight: 33,
						children: [],
					},
					{
						type: "tabset",
						weight: 34,
						children: [],
					},
					{
						type: "tabset",
						weight: 33,
						children: [],
					},
				],
			},
		},
	},
];
