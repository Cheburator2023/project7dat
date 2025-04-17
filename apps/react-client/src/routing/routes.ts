export const routes = {
	home: {
		rootPath: "/",
		name: "Главная",
		subRoutes: {
			graph: { path: "graph", name: "Граф" },
			table: { path: "table", name: "Таблица" },
			standAloneEditor: { path: "standAloneEditor", name: "Редактор" },
		},
	},
	standAloneEditor: {
		rootPath: "/standAloneEditor",
		name: "Редактор",
	},
	table: {
		rootPath: "/table",
		name: "Таблица",
	},
	playground: {
		name: "Песочница",
		rootPath: "/playground",
		devOnly: true,
	},
};
