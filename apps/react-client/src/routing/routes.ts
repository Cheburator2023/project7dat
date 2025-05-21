export const routes = {
	home: {
		rootPath: "/",
		name: "Главная",
		subRoutes: {},
	},
	graph: {
		name: "Граф",
		rootPath: "/graph",
		devOnly: true,
	},
	playground: {
		name: "Песочница",
		rootPath: "/playground",
		devOnly: true,
	},
};
