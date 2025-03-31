/**
 * Define all route path-names here, so that any
 * future change can be easily applied across throughout
 * your application.
 */

export const routes = {
	home: "/",
	dashboard: {
		rootPath: "/dashboard",
		subRoutes: {
			overview: "overview",
			analytics: "analytics",
			settings: "settings",
		},
	},
	account: {
		rootPath: "/account",
		subRoutes: { manage: "manage" },
	},
};
