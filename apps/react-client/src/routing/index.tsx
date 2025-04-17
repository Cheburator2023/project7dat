import { BrowserRouter, Route, Routes } from "react-router";
import { routes } from "./routes";

import { StandAloneEditorPage } from "@react-client/features/standAloneEditor/pages/StandAloneEditorPage";
import { JsonViewerPage } from "../features/JsonViewer/pages/JsonViewerPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { HomePage } from "../features/home/pages/HomePage";
// import { StandAloneEditorPage } from "../features/standAloneEditor/pages/StandAloneEditorPage";
import { Page404 } from "./Page404";
import { JSON4UPage } from "@react-client/features/json4u";

export const Routing = () => (
	<BrowserRouter>
		<Routes>
			<Route path={routes.home.rootPath} element={<HomePage />} />
			<Route path={routes.dashboard.rootPath} element={<DashboardPage />} />
			<Route
				path={routes.standAloneEditor.rootPath}
				element={<StandAloneEditorPage />}
			/>
			<Route path={routes.playground.rootPath} element={<JSON4UPage />} />
			<Route path="*" element={<Page404 />} />
		</Routes>
	</BrowserRouter>
);
