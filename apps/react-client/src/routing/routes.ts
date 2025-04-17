export const routes = {
	home: {
		rootPath: "/",
		name: "Главная",
		subRoutes: {
			graph: { path: "graph", name: "Граф" },
			table: { path: "table", name: "Таблица" },
			text: { path: "text", name: "Редактор" },
		},
	},
	playground: {
		name: "Песочница",
		rootPath: "/playground",
		devOnly: true,
	},
};
