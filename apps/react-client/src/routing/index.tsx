import { BrowserRouter, Route, Routes } from "react-router";
import { routes } from "./routes";

import { Editor } from "@react-client/features/json4u/containers/editor/editor/Editor";
import { Graph } from "@react-client/features/json4u/containers/editor/graph/Graph";
import { JsonTable } from "@react-client/features/json4u/containers/editor/table/JsonTable";
import { JSON4UPage } from "@react-client/features/json4u/pages/JsonViewerPage";

import { PlaygroundPage } from "@react-client/features/playground/PlaygroundPage";
import { Page404 } from "./Page404";

export const Routing = () => (
	<BrowserRouter>
		<Routes>
			<Route path={routes.home.rootPath} element={<JSON4UPage />}>
				<Route index element={<Graph />} />
				<Route
					index
					path={routes.home.subRoutes.graph.path}
					element={<Graph />}
				/>
				<Route
					path={routes.home.subRoutes.text.path}
					element={<Editor kind="secondary" />}
				/>
				<Route
					path={routes.home.subRoutes.table.path}
					element={<JsonTable />}
				/>
			</Route>

			<Route path={routes.playground.rootPath} element={<PlaygroundPage />} />
			<Route path="*" element={<Page404 />} />
		</Routes>
	</BrowserRouter>
);
