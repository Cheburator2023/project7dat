const { merge } = require("webpack-merge");
const path = require("node:path");
const webpack = require("webpack");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const { DefinePlugin } = webpack;
const APP_NAME = "dataLineage";

const common = require("./webpack.common.js");
const git_revision = require("node:child_process")
	.execSync('git show --format="short" -s')
	.toString()
	.trim();

module.exports = merge(common, {
	mode: "development",
	devtool: "cheap-module-source-map",
	cache: false,
	optimization: {
		minimize: false,
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "./public/index.html",
			excludeChunks: [APP_NAME],
			inject: 'body',
			scriptLoading: 'blocking',
			templateContent: ({ htmlWebpackPlugin }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <title>DataLineage UI</title>
    <script>
      window.urlConfig = {
        SUM_FRONTEND: "http://test.host:8002/test",
        SUM_API: "https://test.host",
        SMART_ANKETA_FRONTEND: "http://test.host:8004",
        SMART_ANKETA_API: "http://test.host:8004",
        DATA_LINEAGE_API: "http://localhost:3000",
        SUM_RM_API: "https://test.host/api/rest/v1",
        KEYCLOAK_URL: "https://test.host/auth"
      };
    </script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
			`,
		}),
		new ReactRefreshWebpackPlugin({ overlay: false }),
		new DefinePlugin({
			"process.env": {},
			"process.env.GIT_REVISION": JSON.stringify(git_revision || ""),
			"process.env.APP_NAME": JSON.stringify(APP_NAME),
			"process.env.NO_ROLES": JSON.stringify(process.env.NO_ROLES || ""),
		}),
	],
	watchOptions: {
		poll: 10000,
		ignored: /node_modules/,
	},
	devServer: {
		static: "./",
		port: 8008,
		historyApiFallback: { disableDotRule: true },
		hot: true,
		allowedHosts: ["all"],
		client: {
			overlay: {
				runtimeErrors: (error) => {
					const ignoreErrors = [
						"ResizeObserver loop completed with undelivered notifications.",
					];
					return !ignoreErrors.includes(error.message);
				},
			},
		},
	},
});
