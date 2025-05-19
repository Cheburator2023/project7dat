import "./globals.css";

import { Flex } from "@react-client/common/primitives/Flex";
import { MainPanel } from "@react-client/features/json4u/containers/editor/MainPanel";

export function JSON4UDashboard() {
	return (
		<Flex height="calc(100vh - 55px)">
			<MainPanel />
		</Flex>
	);
}
