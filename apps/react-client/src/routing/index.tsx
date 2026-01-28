import { Route, Routes } from "react-router";
import { routes } from "./routes";
import { PlaygroundPage } from "@react-client/playground/PlaygroundPage";
import { SwaggerPage } from "@react-client/features/swagger/SwaggerPage";
import { Page404 } from "./Page404";
import { EntityPreviewPage } from "@react-client/features/entityPreview/EntityPreviewPage";
import { SnapshotsPage } from "@react-client/features/snapshotsList/SnapshotsPage";
import { JsonDataPage } from "@react-client/features/jsonDataList/JsonDataPage";
import { AllCommitsPage } from "@react-client/features/commitList/AllCommitsPage";
import { ObjectsPage } from "@react-client/new_features/objectsList/ObjectsPage";
import { ObjectCardPage } from "@react-client/new_features/objectsList/ObjectCardPage";
import { CommitQueuePage } from "@react-client/features/commitQueue/CommitQueuePage";
import { ChangelogTablePage } from "@react-client/new_features/changelog/pages/ChangelogTablePage";
import { GraphChangelogPage } from "@react-client/new_features/changelog/GraphChangelogPage";
import { ModelsPage } from "@react-client/new_features/models/ModelsPage";
import { DataMartPreview } from "@react-client/features/dataMart/pages/DataMartPreview";
import { DashboardPage } from "@react-client/features/dashboard/DashboardPage";
import { SettingsPage } from "@react-client/features/settings/SettingsPage";
import { DashboardBuilderPage } from "@react-client/features/dashboardBuilder/DashboardBuilderPage";
import { S2tCommitCreatePage } from "@react-client/features/s2tImport/S2tCommitCreatePage";
import { S2tCommitDetailsPage } from "@react-client/features/s2tImport/S2tCommitDetailsPage";

export const Routing = () => (
	<Routes>
		<Route index element={<DashboardPage />} />

		<Route path={routes.playground.rootPath} element={<PlaygroundPage />} />
		<Route path={routes.swagger.rootPath} element={<SwaggerPage />} />
		<Route path={routes.snapshots.rootPath} element={<SnapshotsPage />} />
		<Route path={routes.jsonData.rootPath} element={<JsonDataPage />} />
		<Route path={routes.allCommits.rootPath} element={<AllCommitsPage />} />
		<Route
			path={routes.s2tCommitCreate.rootPath}
			element={<S2tCommitCreatePage />}
		/>
		<Route
			path={routes.s2tCommitDetails.rootPath}
			element={<S2tCommitDetailsPage />}
		/>
		<Route path={routes.objects.rootPath} element={<ObjectsPage />} />
		<Route path={routes.objectCard.rootPath} element={<ObjectCardPage />} />
		<Route path={routes.models.rootPath} element={<ModelsPage />} />
		<Route path={routes.commitQueue.rootPath} element={<CommitQueuePage />} />
		<Route
			path={routes.changelogTable.rootPath}
			element={<ChangelogTablePage />}
		/>
		<Route
			path={routes.graphChangelog.rootPath}
			element={<GraphChangelogPage />}
		/>
		<Route
			path={routes.entityPreview.rootPath}
			element={<EntityPreviewPage />}
		/>
		<Route
			path={routes.dataMartPreview.rootPath}
			element={<DataMartPreview />}
		/>
		<Route path={routes.settings.rootPath} element={<SettingsPage />} />
		<Route
			path={routes.dashboardBuilder.rootPath}
			element={<DashboardBuilderPage />}
		/>
		<Route path="*" element={<Page404 />} />
	</Routes>
);
