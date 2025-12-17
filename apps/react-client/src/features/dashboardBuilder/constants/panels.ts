import type { PanelDefinition } from "../types";

export const AVAILABLE_PANELS: PanelDefinition[] = [
	{
		id: "entities",
		name: "Сущности",
		icon: "📊",
		component: "entities",
		description: "Таблица сущностей с фильтрацией",
	},
	{
		id: "objects",
		name: "Объекты",
		icon: "📋",
		component: "objects",
		description: "Список объектов данных",
	},
	{
		id: "graph",
		name: "Граф",
		icon: "🔗",
		component: "graph",
		description: "Визуализация связей между сущностями",
	},
	{
		id: "selection-info",
		name: "Информация",
		icon: "ℹ️",
		component: "selection-info",
		description: "Детали выбранного элемента",
	},
	{
		id: "code-editor",
		name: "Редактор",
		icon: "✏️",
		component: "code-editor",
		description: "Редактор кода",
	},
	{
		id: "commit-history",
		name: "История",
		icon: "📜",
		component: "commit-history",
		description: "История коммитов",
	},
	{
		id: "issues",
		name: "Ошибки",
		icon: "⚠️",
		component: "issues",
		description: "Список ошибок и предупреждений",
	},
	{
		id: "schema",
		name: "Схема",
		icon: "📋",
		component: "schema",
		description: "Схема данных",
	},
	{
		id: "ag-charts",
		name: "Графики",
		icon: "📈",
		component: "ag-charts",
		description: "Аналитические графики и диаграммы",
	},
];
