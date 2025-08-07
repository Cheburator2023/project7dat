import { Route, Routes } from "react-router";
import { routes } from "./routes";
import { PlaygroundPage } from "@react-client/features/playground/PlaygroundPage";
import { DebugPage } from "@react-client/features/debug/DebugPage";
import { SwaggerPage } from "@react-client/features/debug/SwaggerPage";
import { Page404 } from "./Page404";
import { DashboardPageFlex } from "@react-client/features/dashboard/DashboardPageFlex";
import { EntityPreviewPage } from "@react-client/features/entityPreview/EntityPreviewPage";

export const Routing = () => (
	<Routes>
		<Route index element={<DashboardPageFlex />} />

		<Route path={routes.playground.rootPath} element={<PlaygroundPage />} />
		<Route path={routes.debug.rootPath} element={<DebugPage />} />
		<Route path={routes.swagger.rootPath} element={<SwaggerPage />} />
		<Route
			path={routes.entityPreview.rootPath}
			element={<EntityPreviewPage />}
		/>
		<Route path="*" element={<Page404 />} />
	</Routes>
);
