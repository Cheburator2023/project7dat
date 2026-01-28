const { merge } = require("webpack-merge");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const { DefinePlugin } = webpack;
const common = require("./webpack.common.js");
const APP_NAME = "dataLineage";

const git_revision = require("child_process")
	.execSync('git show --format="short" -s')
	.toString()
	.trim();

module.exports = merge(common, {
	mode: "development",
	devtool: "cheap-module-source-map",
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					compress: {
						drop_console: true,
					},
					mangle: true,
					output: {
						comments: false,
					},
				},
			}),
		],
		splitChunks: {
			chunks: "async",
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: "vendors",
					chunks: "initial",
					enforce: true,
				},
			},
		},
		runtimeChunk: false,
		moduleIds: "deterministic",
		chunkIds: "deterministic",
		usedExports: true,
		sideEffects: false,
		concatenateModules: false,
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "./public/index.html",
			excludeChunks: [APP_NAME],
		}),
		new DefinePlugin({
			"process.env": {},
			"process.env.GIT_REVISION": JSON.stringify(git_revision || ""),
			"process.env.APP_NAME": JSON.stringify(APP_NAME),
			"process.env.NO_ROLES": JSON.stringify(process.env.NO_ROLES || ""),
		}),
	],
});
