import { Route, Routes } from "react-router";
import { PlaygroundPage } from "@react-client/playground/PlaygroundPage";
import { SwaggerPage } from "@react-client/features/swagger/pages/SwaggerPage";

import { EntityPreviewPage } from "@react-client/features/entityPreview/pages/EntityPreviewPage";
import { AllCommitsPage } from "@react-client/features/commits/pages/AllCommitsPage";
import { ObjectsPage } from "@react-client/features/entities/pages/ObjectsPage";
import { ModelsPage } from "@react-client/features/models/pages/ModelsPage";
import { SettingsPage } from "@react-client/features/settings/pages/SettingsPage";
import { S2tCommitCreatePage } from "@react-client/features/s2tImport/pages/S2tCommitCreatePage";
import { S2tCommitDetailsPage } from "@react-client/features/s2tImport/pages/S2tCommitDetailsPage";
import { ModelPreviewPage } from "@react-client/features/modelPreview/pages/ModelPreviewPage";
import { JsonDataReportPage } from "@react-client/features/reports/pages/JsonDataReportPage";
import { S2tDataReportPage } from "@react-client/features/reports/pages/S2tDataReportPage";
import { CommitMergePreviewPage } from "@react-client/features/commits/pages/CommitMergePreviewPage";

import { Page404 } from "./Page404";
import { routes } from "./routes";
import { DashboardPage } from "@react-client/features/dashboard/pages/DashboardPage";

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
		<Route
			path={routes.commitMergePreview.rootPath}
			element={<CommitMergePreviewPage />}
		/>
		<Route path="*" element={<Page404 />} />
	</Routes>
);
