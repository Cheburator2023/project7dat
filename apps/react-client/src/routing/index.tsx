import { Route, Routes } from "react-router";
import { routes } from "./routes";
import { PlaygroundPage } from "@react-client/features/playground/PlaygroundPage";
import { SwaggerPage } from "@react-client/features/swagger/SwaggerPage";
import { Page404 } from "./Page404";
import { DashboardPageFlex } from "@react-client/features/dashboard/DashboardPageFlex";
import { EntityPreviewPage } from "@react-client/features/entityPreview/EntityPreviewPage";
import { SnapshotsPage } from "@react-client/features/snapshotsList/SnapshotsPage";
import { JsonDataPage } from "@react-client/features/jsonDataList/JsonDataPage";
import { AllCommitsPage } from "@react-client/features/commitList/AllCommitsPage";

export const Routing = () => (
	<Routes>
		<Route index element={<DashboardPageFlex />} />

		<Route path={routes.playground.rootPath} element={<PlaygroundPage />} />
		<Route path={routes.swagger.rootPath} element={<SwaggerPage />} />
		<Route path={routes.snapshots.rootPath} element={<SnapshotsPage />} />
		<Route path={routes.jsonData.rootPath} element={<JsonDataPage />} />
		<Route path={routes.allCommits.rootPath} element={<AllCommitsPage />} />
		<Route
			path={routes.entityPreview.rootPath}
			element={<EntityPreviewPage />}
		/>
		<Route path="*" element={<Page404 />} />
	</Routes>
);
