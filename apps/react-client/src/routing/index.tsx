import { Route, Routes } from "react-router";
import { routes } from "./routes";

import { DashboardPage } from "@react-client/features/dashboard/DashboardPage";
import { PlaygroundPage } from "@react-client/features/playground/PlaygroundPage";
import { DebugPage } from "@react-client/features/debug/DebugPage";
import { Page404 } from "./Page404";

export const Routing = () => (
	<Routes>
		{/* <Route path={routes.home.rootPath} element={<DashboardPage />} /> */}
		<Route index element={<DashboardPage />} />

		<Route path={routes.playground.rootPath} element={<PlaygroundPage />} />
		<Route path={routes.debug.rootPath} element={<DebugPage />} />
		<Route path="*" element={<Page404 />} />
	</Routes>
);
