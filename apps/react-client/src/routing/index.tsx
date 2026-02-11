import { Route, Routes } from "react-router";
import { PlaygroundPage } from "@react-client/playground/PlaygroundPage";
import { SwaggerPage } from "@react-client/features/swagger/SwaggerPage";

import { EntityPreviewPage } from "@react-client/features/entityPreview/EntityPreviewPage";
import { AllCommitsPage } from "@react-client/features/commitList/AllCommitsPage";
import { ObjectsPage } from "@react-client/features/objects/ObjectsPage";
import { ModelsPage } from "@react-client/features/models/ModelsPage";
import { DashboardPage } from "@react-client/features/dashboard/DashboardPage";
import { SettingsPage } from "@react-client/features/settings/SettingsPage";
import { S2tCommitCreatePage } from "@react-client/features/s2tImport/S2tCommitCreatePage";
import { S2tCommitDetailsPage } from "@react-client/features/s2tImport/S2tCommitDetailsPage";
import { ModelPreviewPage } from "@react-client/features/modelPreview/ModelPreviewPage";
import { JsonDataReportPage } from "@react-client/features/reports/JsonDataReportPage";
import { S2tDataReportPage } from "@react-client/features/reports/S2tDataReportPage";

import { Page404 } from "./Page404";
import { routes } from "./routes";

export const Routing = () => (
	<Routes>
		<Route index element={<DashboardPage />} />

		<Route path={routes.playground.rootPath} element={<PlaygroundPage />} />
		<Route path={routes.swagger.rootPath} element={<SwaggerPage />} />
		<Route path={routes.allCommits.rootPath} element={<AllCommitsPage />} />
		<Route
			path={routes.s2tCommitCreate.rootPath}
			element={<S2tCommitCreatePage />}
		/>
		<Route
			path={routes.s2tCommitDetails.rootPath}
			element={<S2tCommitDetailsPage />}
		/>
		<Route
			path={routes.s2tDataReport.rootPath}
			element={<S2tDataReportPage />}
		/>
		<Route
			path={routes.jsonDataReport.rootPath}
			element={<JsonDataReportPage />}
		/>
		<Route path={routes.objects.rootPath} element={<ObjectsPage />} />
		<Route path={routes.models.rootPath} element={<ModelsPage />} />
		<Route path={routes.modelCard.rootPath} element={<ModelPreviewPage />} />
		<Route
			path={routes.entityPreview.rootPath}
			element={<EntityPreviewPage />}
		/>
		<Route path={routes.settings.rootPath} element={<SettingsPage />} />
		<Route path="*" element={<Page404 />} />
	</Routes>
);
