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
		name: "Реестр снепшотов",
		rootPath: "/snapshots",
		disabled: false,
		showInNavbar: true,
	},
	jsonData: {
		name: "JSON Реестр",
		rootPath: "/json-data",
		disabled: false,
		showInNavbar: true,
	},
	allCommits: {
		name: "Реестр коммитов",
		rootPath: "/all-commits",
		disabled: false,
		showInNavbar: true,
	},
	changelog: {
		name: "История изменений",
		rootPath: "/changelog",
		disabled: false,
		showInNavbar: true,
	},
	graphChangelog: {
		name: "История графика",
		rootPath: "/changelog/:graphId",
		disabled: false,
		showInNavbar: false,
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
