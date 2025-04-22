import { JSON4UDashboard } from "@react-client/features/json4u/organisms/JSON4UDashboard";
import { ReactFlowProvider } from "@xyflow/react";
import type React from "react";

import { MainLayout } from "../../../common/layouts/MainLayout";

export const JSON4UPage: React.FC = () => {
	return (
		<MainLayout>
			<ReactFlowProvider>
				<JSON4UDashboard />
			</ReactFlowProvider>
		</MainLayout>
	);
};
