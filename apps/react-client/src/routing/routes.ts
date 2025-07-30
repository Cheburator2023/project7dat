export const routes = {
	home: {
		rootPath: "/",
		name: "Главная",
		disabled: false,
		subRoutes: {},
	},
	dashboard: {
		rootPath: "/dashboard",
		name: "Dasboard Flex Doc",
		disabled: false,
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
	},
	debug: {
		name: "Отладка",
		rootPath: "/debug",
		devOnly: true,
		disabled: false,
	},
};
