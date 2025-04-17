import { JSON4UDashboard } from "@react-client/features/json4u/organisms/JSON4UDashboard";
import {
	type Edge,
	type Node,
	ReactFlow,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import type React from "react";
import { useCallback } from "react";
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
