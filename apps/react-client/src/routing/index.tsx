import { Route, Routes } from "react-router";
import { routes } from "./routes";

import { DashboardPage } from "@react-client/features/dashboard/DashboardPage";
import { JSON4UDashboard } from "@react-client/features/json4u/organisms/JSON4UDashboard";
import { PlaygroundPage } from "@react-client/features/playground/PlaygroundPage";
import { Page404 } from "./Page404";

export const Routing = () => (
	<Routes>
		{/* <Route path={routes.home.rootPath} element={<DashboardPage />} /> */}
		<Route index element={<DashboardPage />} />

		<Route path={routes.playground.rootPath} element={<PlaygroundPage />} />
		<Route path={routes.graph.rootPath} element={<JSON4UDashboard />} />
		<Route path="*" element={<Page404 />} />
	</Routes>
);
