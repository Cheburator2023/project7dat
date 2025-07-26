import { initLogger } from "@react-client/common/json4u_leftovers/utils";
import { Dashboard } from "@react-client/features/dashboard/Dashboard";

initLogger();

export const DashboardPage = () => {
	return <Dashboard />;
};
