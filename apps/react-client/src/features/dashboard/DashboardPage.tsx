import { Dashboard } from "@react-client/features/dashboard/Dashboard";
import { initLogger } from "@react-client/features/json4u/lib/utils";

initLogger();

export const DashboardPage = () => {
	return <Dashboard />;
};
