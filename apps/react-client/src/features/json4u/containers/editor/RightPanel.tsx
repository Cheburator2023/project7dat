import { Button } from "@mui/material";
import {
	Container,
	ContainerContent,
	ContainerHeader,
} from "@react-client/features/json4u/components/Container";
import { ViewSearchInput } from "@react-client/features/json4u/components/ui/search/ViewSearchInput";
import { Switch } from "@react-client/features/json4u/components/ui/switch";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@react-client/features/json4u/components/ui/tabs";
import { Editor } from "@react-client/features/json4u/containers/editor/editor/Editor";
import { Graph } from "@react-client/features/json4u/containers/editor/graph/Graph";
import { SwapButton } from "@react-client/features/json4u/containers/editor/mode/SwapButton";
import { JsonTable } from "@react-client/features/json4u/containers/editor/table/JsonTable";
import {
	ViewMode,
	type ViewModeValue,
} from "@react-client/features/json4u/lib/db/config";
import { useEditorStore } from "@react-client/features/json4u/stores/editorStore";
import { useConfigFromCookies } from "@react-client/features/json4u/stores/hook";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { Expand, Shrink, Table2, Text, Waypoints } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";

export function RightPanel() {
	const cc = useConfigFromCookies();
	const { viewMode, setViewMode } = useStatusStore(
		useShallow((state) => ({
			viewMode: state._hasHydrated ? state.viewMode : cc.viewMode,
			setViewMode: state.setViewMode,
		})),
	);

	return (
		<Tabs
			asChild
			defaultValue={viewMode}
			value={viewMode}
			onValueChange={(mode) => setViewMode(mode as ViewModeValue)}
		>
			<Container>
				<ContainerHeader>
					<TabsList>
						{[ViewMode.Text, ViewMode.Graph, ViewMode.Table].map((mode) => (
							<TabIcon key={mode} viewMode={mode} className="icon" />
						))}
					</TabsList>
					<Buttons viewMode={viewMode} />
				</ContainerHeader>
				<ContainerContent>
					<TabView viewMode={ViewMode.Text}>
						<Editor kind="secondary" />
					</TabView>
					<TabView viewMode={ViewMode.Graph}>
						<Graph />
					</TabView>
					<TabView viewMode={ViewMode.Table}>
						<JsonTable />
					</TabView>
				</ContainerContent>
			</Container>
		</Tabs>
	);
}

function Buttons({ viewMode }: { viewMode: ViewMode }) {
	const cc = useConfigFromCookies();
	const t = useTranslations();
	const runCommand = useEditorStore((state) => state.runCommand);
	const { enableTextCompare, setEnableTextCompare } = useStatusStore(
		useShallow((state) => ({
			enableTextCompare: state._hasHydrated
				? state.enableTextCompare
				: cc.enableTextCompare,
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
							{t(enableTextCompare ? "TextCompare" : "compare")}
						</Button>
					</div>
					<SwapButton variant="icon-outline" className="px-2" />
				</>
			)}
			{viewMode === ViewMode.Graph && <ViewSearchInput />}
			<FullScreenButton />
		</div>
	);
}

function FullScreenButton() {
	const t = useTranslations();
	const [fullscreen, setFullscreen] = useState(false);
	const Icon = fullscreen ? Shrink : Expand;

	return (
		<Button
			title={t(fullscreen ? "shrink_screen" : "expand_screen")}
			className="px-2"
			variant="outlined"
			onClick={() => {
				if (fullscreen) {
					setFullscreen(false);
					window.leftPanelHandle?.expand();
				} else {
					setFullscreen(true);
					window.leftPanelHandle?.collapse();
				}
			}}
		>
			<Icon className="icon" />
		</Button>
	);
}

const viewMode2Icon = {
	[ViewMode.Text]: Text,
	[ViewMode.Graph]: Waypoints,
	[ViewMode.Table]: Table2,
};

function TabIcon({
	viewMode,
	className,
}: { viewMode: ViewMode; className: string }) {
	const t = useTranslations();
	const Icon = viewMode2Icon[viewMode];

	return (
		<TabsTrigger
			title={t(viewMode)}
			value={viewMode}
			className="text-zinc-600 dark:text-zinc-200"
		>
			<Icon className={className} />
		</TabsTrigger>
	);
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
