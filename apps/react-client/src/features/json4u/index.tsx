import "./globals.css";

import { Separator } from "@react-client/features/json4u/components/ui/separator";
import { TooltipProvider } from "@react-client/features/json4u/components/ui/tooltip";
import MainPanel from "@react-client/features/json4u/containers/editor/MainPanel";
import SideNav from "@react-client/features/json4u/containers/editor/sidenav";
import { ThemeProvider } from "next-themes";

export function JSON4UPage() {
	return (
		<TooltipProvider delayDuration={0}>
			<ThemeProvider defaultTheme="light" disableTransitionOnChange>
				<main className="w-screen h-screen">
					<div className="flex h-full w-full">
						<SideNav />
						<Separator orientation="vertical" />
						<MainPanel />
					</div>
				</main>
			</ThemeProvider>
		</TooltipProvider>
	);
}
