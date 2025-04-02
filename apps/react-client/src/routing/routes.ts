export const routes = {
	home: {
		rootPath: "/",
		name: "Главная",
	},
	dashboard: {
		rootPath: "/dashboard",
		name: "Дашборд",
	},
	standAloneEditor: {
		name: "Редактор",
		rootPath: "/standAloneEditor",
		subRoutes: { editor: "editor" },
	},
};
