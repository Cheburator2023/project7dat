import "./globals.css";

import { Flex } from "@react-client/common/primitives/Flex";
import { TooltipProvider } from "@react-client/features/json4u/components/ui/tooltip";
import { MainPanel } from "@react-client/features/json4u/containers/editor/MainPanel";

export function JSON4UDashboard() {
	return (
		<TooltipProvider delayDuration={0}>
			<Flex height="calc(100vh - 60px)">
				<MainPanel />
			</Flex>
		</TooltipProvider>
	);
}
