export const routes = {
	home: {
		rootPath: "/",
		name: "Главная",
		disabled: false,
		showInNavbar: true,
		subRoutes: {},
	},
	snapshots: {
		name: "Реестр снепшотов",
		rootPath: "/snapshots",
		disabled: false,
		showInNavbar: false,
	},
	s2tDataReport: {
		name: "Формат S2T",
		rootPath: "/reports/s2t-data",
		disabled: true,
		showInNavbar: false,
	},
	jsonDataReport: {
		name: "Формат JSON",
		rootPath: "/reports/json-data",
		disabled: true,
		showInNavbar: false,
	},
	s2tCommitCreate: {
		name: "Создание S2T коммита",
		rootPath: "/s2t-commits/new",
		disabled: false,
		showInNavbar: false,
	},
	allCommits: {
		name: "Реестр коммитов",
		rootPath: "/reports/all-commits",
		disabled: false,
		showInNavbar: true,
	},
	objects: {
		name: "Объекты данных",
		rootPath: "/services/objects",
		disabled: false,
		showInNavbar: true,
	},
	models: {
		name: "Модели",
		rootPath: "/services/models",
		disabled: false,
		showInNavbar: true,
	},

	modelServices: {
		name: "Модельные сервисы",
		rootPath: "/services/model-services",
		disabled: false,
		showInNavbar: true,
	},
	// CRUD pages
	entityPreview: {
		name: "Просмотр сущности",
		rootPath: "/entity/:entityId",
		disabled: false,
		showInNavbar: false,
	},
	s2tCommitDetails: {
		name: "S2T коммит",
		rootPath: "/s2t-commits/:id",
		disabled: false,
		showInNavbar: false,
	},
	commitMergePreview: {
		name: "Предпросмотр коммита",
		rootPath: "/commits/:id/merge",
		disabled: false,
		showInNavbar: false,
	},
	modelCard: {
		name: "Модели",
		rootPath: "/services/models/:entityId",
		disabled: false,
		showInNavbar: false,
	},
	// aux
	settings: {
		name: "Настройки",
		rootPath: "/settings",
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
