import { Button } from "@mui/material";
import {
	Container,
	ContainerContent,
	ContainerHeader,
} from "@react-client/features/json4u/components/Container";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@react-client/features/json4u/components/ui/resizable";
import { ViewSearchInput } from "@react-client/features/json4u/components/ui/search/ViewSearchInput";
import { Separator } from "@react-client/features/json4u/components/ui/separator";
import { Switch } from "@react-client/features/json4u/components/ui/switch";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@react-client/features/json4u/components/ui/tabs";
import { ModePanel } from "@react-client/features/json4u/containers/editor/mode/ModePanel";
import { setupGlobalGraphStyle } from "@react-client/features/json4u/lib/graph/layout";
import { cn } from "@react-client/features/json4u/lib/utils";
import { px2num } from "@react-client/features/json4u/lib/utils";
import { initLogger } from "@react-client/features/json4u/lib/utils";
import { useConfigFromCookies } from "@react-client/features/json4u/stores/hook";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useUserStore } from "@react-client/features/json4u/stores/userStore";
import { wrap } from "comlink";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { useShallow } from "zustand/react/shallow";
import type { MyWorker } from "../../../../features/json4u/lib/worker/worker";

import { Editor } from "@react-client/features/json4u/containers/editor/editor/Editor";
import { Graph } from "@react-client/features/json4u/containers/editor/graph/Graph";
import { SwapButton } from "@react-client/features/json4u/containers/editor/mode/SwapButton";
import { JsonTable } from "@react-client/features/json4u/containers/editor/table/JsonTable";
import {
	ViewMode,
	type ViewModeValue,
} from "@react-client/features/json4u/lib/db/config";
import { useEditorStore } from "@react-client/features/json4u/stores/editorStore";
import { Table2, Text, Waypoints } from "lucide-react";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { StatusBar } from "./StatusBar";

const leftPanelId = "left-panel";
const rightPanelId = "right-panel";
initLogger();

export function MainPanel() {
	const {
		rightPanelSize,
		rightPanelCollapsed,
		viewMode,
		setViewMode,
		setRightPanelSize,
		setRightPanelCollapsed,
	} = useStatusStore();

	useObserveResize();

	// see https://github.com/bvaughn/react-resizable-panels/issues/128#issuecomment-1523343548
	return (
		<div className="relative w-full h-full flex flex-col overflow-hidden">
			<ResizablePanelGroup
				className="flex-grow"
				direction="horizontal"
				onLayout={(layout: any[]) => setRightPanelSize(layout[1])}
			>
				<ResizablePanel
					id={leftPanelId}
					ref={(ref: any) => {
						window.leftPanelHandle = ref;
					}}
					collapsible
					defaultSize={100 - rightPanelSize}
					minSize={0}
				>
					<LeftPanel />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className={cn("hover:bg-blue-600", rightPanelCollapsed && "w-3")}
				/>
				<ResizablePanel
					id={rightPanelId}
					defaultSize={rightPanelSize}
					minSize={10}
					collapsible={true}
					onCollapse={() => setRightPanelCollapsed(true)}
					onExpand={() => setRightPanelCollapsed(false)}
					className={cn(
						rightPanelCollapsed && "transition-all duration-300 ease-in-out",
					)}
				>
					<Outlet />
					{/* <Tabs
						asChild
						defaultValue={viewMode}
						value={viewMode}
						onValueChange={(mode) => setViewMode(mode as ViewModeValue)}
					>
						<>
							<TabView viewMode={ViewMode.Text}>
								<Editor kind="secondary" />
							</TabView>
							<TabView viewMode={ViewMode.Graph}>
								<Graph />
							</TabView>
							<TabView viewMode={ViewMode.Table}>
								<JsonTable />
							</TabView>
						</>
					</Tabs> */}
				</ResizablePanel>
			</ResizablePanelGroup>
			<ModePanel />
			<Separator />
			<StatusBar />
			<WidthMeasure />
		</div>
	);
}

function useObserveResize() {
	const { setLeftPanelWidth, setRightPanelWidth } = useStatusStore(
		useShallow((state) => ({
			setLeftPanelWidth: state.setLeftPanelWidth,
			setRightPanelWidth: state.setRightPanelWidth,
		})),
	);

	useEffect(() => {
		const leftPanel = document.getElementById(leftPanelId)!;
		const rightPanel = document.getElementById(rightPanelId)!;
		setLeftPanelWidth(leftPanel.offsetWidth);
		setRightPanelWidth(rightPanel.offsetWidth);

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target.id === leftPanelId) {
					setLeftPanelWidth(entry.contentRect.width);
				} else {
					setRightPanelWidth(entry.contentRect.width);
				}
			}
		});

		resizeObserver.observe(leftPanel);
		resizeObserver.observe(rightPanel);
	}, []);
}

function WidthMeasure() {
	useInitial();

	return (
		<div id="width-measure" className="absolute invisible graph-node">
			<div className="graph-kv">
				<div className="graph-k">
					<span>{"measure"}</span>
				</div>
				<div className="graph-v" />
			</div>
		</div>
	);
}

function useInitial() {
	const cc = useConfigFromCookies();
	const { user } = useUserStore(
		useShallow((state) => ({
			user: state.user,
		})),
	);

	useEffect(() => {
		useStatusStore.setState({ _hasHydrated: true, ...cc });

		// initial worker

		window.rawWorker = new Worker(
			new URL(
				"../../../../features/json4u/lib/worker/worker.ts",
				import.meta.url,
			),
			{
				type: "module",
			},
		);

		window.worker = wrap<MyWorker>(window.rawWorker);
		window.addEventListener("beforeunload", () => {
			window.rawWorker?.terminate();
		});

		// measure graph style
		const el = document.getElementById("width-measure")!;
		const span = el.querySelector("span")!;
		const { lineHeight } = getComputedStyle(span);
		const { borderWidth } = getComputedStyle(el);
		const { paddingLeft, paddingRight } = getComputedStyle(
			el.querySelector(".graph-kv")!,
		);
		const { marginRight, maxWidth: maxKeyWidth } = getComputedStyle(
			el.querySelector(".graph-k")!,
		);
		const { maxWidth: maxValueWidth } = getComputedStyle(
			el.querySelector(".graph-v")!,
		);
		const measured = {
			fontWidth: span.offsetWidth / (span.textContent?.length || 1),
			kvHeight: px2num(lineHeight),
			padding: px2num(paddingLeft) + px2num(paddingRight),
			borderWidth: px2num(borderWidth),
			kvGap: px2num(marginRight),
			maxKeyWidth: px2num(maxKeyWidth),
			maxValueWidth: px2num(maxValueWidth),
		};

		setupGlobalGraphStyle(measured);

		window.worker.setupGlobalGraphStyle(measured);

		console.l("finished measuring graph base style:", measured);
	}, []);
}

function TabView({
	viewMode,
	children,
}: { viewMode: ViewMode; children: React.ReactNode }) {
	// `data-[state=inactive]` used for fix https://github.com/radix-ui/primitives/issues/1155#issuecomment-2041571341
	return (
		<TabsContent
			value={viewMode}
			className="relative w-full h-full m-0 data-[state=inactive]:hidden"
			forceMount
		>
			{children}
		</TabsContent>
	);
}

function Buttons({ viewMode }: { viewMode: ViewMode }) {
	const runCommand = useEditorStore((state) => state.runCommand);
	const { enableTextCompare, setEnableTextCompare } = useStatusStore(
		useShallow((state) => ({
			enableTextCompare: state.enableTextCompare,
			setEnableTextCompare: state.setEnableTextCompare,
		})),
	);

	return (
		<div className="flex items-center ml-auto space-x-2">
			{viewMode === ViewMode.Text && (
				<>
					<div className="flex items-center rounded-md pl-1 bg-muted text-zinc-600">
						<Switch
							checked={enableTextCompare}
							onCheckedChange={setEnableTextCompare}
						/>
						<Button className="px-2" onClick={() => runCommand("compare")}>
							{enableTextCompare ? "TextCompare" : "compare"}
						</Button>
					</div>
					<SwapButton variant="icon-outline" className="px-2" />
				</>
			)}
			{/* {viewMode === ViewMode.Graph && <ViewSearchInput />} */}
			{/* <FullScreenButton /> */}
		</div>
	);
}
