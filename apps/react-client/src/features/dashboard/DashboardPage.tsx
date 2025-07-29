import { initLogger } from "@react-client/common/json4u_leftovers/utils";
import { Dashboard } from "@react-client/features/dashboard/Dashboard";
import { useCurrentDataLineageGraph } from "@react-client/hooks/api";

initLogger();

export const DashboardPage = () => {
	useCurrentDataLineageGraph();

	return <Dashboard />;
};
