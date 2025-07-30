import { initLogger } from "@react-client/common/json4u_leftovers/utils";
import { DashboardFlex } from "@react-client/features/dashboard/DashboardFlex";
import { useCurrentDataLineageGraph } from "@react-client/hooks/api";

initLogger();

export const DashboardPageFlex = () => {
	useCurrentDataLineageGraph();

	return <DashboardFlex />;
};
