import { initLogger } from "@react-client/common/json4u_leftovers/utils";
import { Dashboard } from "@react-client/features/dashboard/Dashboard";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";

initLogger();

export const DashboardPage = () => {
	useCurrentDataLineageGraph();

	return <Dashboard />;
};
