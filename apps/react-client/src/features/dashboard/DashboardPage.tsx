import { Card } from "@react-client/common/muiCustom/Card";
import { CommitHistory } from "@react-client/features/commitHistory/CommitHistory";
import { Dashboard } from "@react-client/features/dashboard/Dashboard";
import { DataMart } from "@react-client/features/dataMart/DataMart";
import { Graph } from "@react-client/features/json4u/containers/editor/graph/Graph";
import { JsonEditorWithDiff } from "@react-client/features/jsonEditor/organisms/JsonEditorWithDiff";

export const DashboardPage = () => {
	return (
		<Dashboard
			leftPanel={
				<Card header="Редактор" maxHeight="100%" height="100%">
					<JsonEditorWithDiff />
				</Card>
			}
			rightPanel={
				<Card header="История коммитов" maxHeight="100%" height="100%">
					<CommitHistory />
				</Card>
			}
			bottomPanel={
				<Card header="Витрина" maxHeight="100%" height="100%">
					<DataMart />
				</Card>
			}
			backgroundPanel={<Graph />}
		/>
	);
};
