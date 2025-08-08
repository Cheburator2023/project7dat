export const routes = {
	home: {
		rootPath: "/",
		name: "Главная",
		disabled: false,
		showInNavbar: true,
		subRoutes: {},
	},
	entityPreview: {
		name: "Просмотр сущности",
		rootPath: "/entity/:entityId",
		disabled: false,
		showInNavbar: false,
	},
	snapshots: {
		name: "Снепшоты",
		rootPath: "/snapshots",
		disabled: false,
		showInNavbar: true,
	},
	jsonData: {
		name: "JSON Данные",
		rootPath: "/json-data",
		disabled: false,
		showInNavbar: true,
	},
	allCommits: {
		name: "Все коммиты",
		rootPath: "/all-commits",
		disabled: false,
		showInNavbar: true,
	},
	// dev
	playground: {
		name: "Песочница",
		rootPath: "/playground",
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
};
