import { BrowserRouter, Route, Routes } from "react-router";
import { routes } from "./routes";

import { DashboardPage } from "../features/Dashboard/pages/DashboardPage";
import { HomePage } from "../features/Home/HomePage";
import { StandAloneEditorPage } from "../features/StandAloneEditor/pages/StandAloneEditorPage";
import { Page404 } from "./Page404";

export const Routing = () => (
	<BrowserRouter>
		<Routes>
			<Route path={routes.home} element={<HomePage />} />
			<Route path={routes.dashboard.rootPath} element={<DashboardPage />} />
			<Route
				path={routes.standAloneEditor.rootPath}
				element={<StandAloneEditorPage />}
			/>
			<Route path="*" element={<Page404 />} />
		</Routes>
	</BrowserRouter>
);
