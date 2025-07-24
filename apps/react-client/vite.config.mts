import child_process from "node:child_process";
import path from "node:path";
import { URL, fileURLToPath } from "node:url";

import svgr from "@svgr/rollup";
import react from "@vitejs/plugin-react";
import { type HttpProxy, defineConfig, type PluginOption } from "vite";
import checker from "vite-plugin-checker";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

const { STAGE } = process.env;
const ROOT_DIR = path.resolve(__dirname, "./");
const DIST_DIR = path.resolve(ROOT_DIR, "./dist");
const EDITOR_WORKER_PATH = path.resolve(
	ROOT_DIR,
	"./src/features/json4u/lib/worker/worker.ts",
);

const proxyList = {
	dev: "https://example.com",
};
const currentTarget = STAGE
	? proxyList[STAGE as keyof typeof proxyList]
	: proxyList.dev;

const git_revision = child_process
	.execSync('git show --format="short" -s')
	.toString()
	.trim();

export default defineConfig({
	cacheDir: fileURLToPath(new URL("./.cache/vite-app", import.meta.url)),
	base: "/",
	build: {
		target: "baseline-widely-available",
		commonjsOptions: { transformMixedEsModules: true },
		rollupOptions: {
			output: {
				dir: DIST_DIR,
				strict: false,
				entryFileNames: "[name].js",
				manualChunks: {
					react: ["react", "react-dom", "react-router-dom"],
				},
			},
		},
	},

	json: {
		stringify: "auto",
	},

	css: {
		preprocessorOptions: {
			sass: {
				api: "modern",
			},
			scss: {
				api: "modern",
			},
		},
	},

	plugins: [
		tsconfigPaths() as PluginOption,
		nodePolyfills({
			include: ["net"],
		}) as PluginOption,
		react() as PluginOption,
		svgr({
			dimensions: false,
			svgProps: {
				focusable: "{false}",
			},
		}) as PluginOption,
		checker({
			biome: {
				dev: {
					logLevel: ["error"],
				},
			},
			typescript: true,
			overlay: {
				initialIsOpen: false,
			},
		}) as PluginOption,
	],

	define: {
		"process.env.MOCKED_REQUESTS": JSON.stringify(process.env.MOCKED_REQUESTS),
		"process.env.GIT_REVISION": JSON.stringify(git_revision),
		"process.env.EDITOR_WORKER_PATH": JSON.stringify(EDITOR_WORKER_PATH),
	},

	server: {
		fs: {
			strict: false,
		},
		port: 8008,
		proxy: {
			"/api": {
				target: currentTarget,
				secure: false,
				rewrite(_path: string) {
					return _path.replace(/^\/api/, "");
				},
				changeOrigin: true,
			},
			"/socket": {
				target: currentTarget,
				headers: {
					Origin: currentTarget,
				},
				rewrite(_path: string) {
					return _path.replace(/^\/socket/, "");
				},
				configure: (proxy: HttpProxy.Server) => {
					proxy.on("error", (err) => {
						console.warn("Socket error using onProxyReqWs event", err);
					});
				},
				ws: true,
				secure: false,
				changeOrigin: true,
			},
		},
	},
});
