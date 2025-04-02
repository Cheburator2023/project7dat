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
		rootPath: "/stand-alone-editor",
		subRoutes: { editor: "editor" },
	},
};
