export const routes = {
	home: {
		rootPath: "/",
		name: "Главная",
		disabled: false,
		showInNavbar: true,
		subRoutes: {},
	},
	// graph: {
	// 	name: "Граф",
	// 	rootPath: "/graph",
	// 	devOnly: true,
	// },
	playground: {
		name: "Песочница",
		rootPath: "/playground",
		devOnly: true,
		disabled: false,
		showInNavbar: true,
	},
	debug: {
		name: "Отладка",
		rootPath: "/debug",
		devOnly: true,
		disabled: false,
		showInNavbar: true,
	},
	swagger: {
		name: "API Документация",
		rootPath: "/swagger",
		devOnly: true,
		disabled: false,
		showInNavbar: true,
	},
	entityPreview: {
		name: "Просмотр сущности",
		rootPath: "/entity/:entityId",
		disabled: false,
		showInNavbar: false,
	},
	snapshots: {
		name: "Снимки",
		rootPath: "/snapshots",
		disabled: false,
		showInNavbar: true,
	},
};
