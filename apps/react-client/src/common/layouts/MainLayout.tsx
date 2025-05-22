import { styled } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";
import { useGlobalSettingsStore } from "@react-client/common/store/globalSettingsStore";
import { Header } from "../../features/navigation/organisms/Header";
import { SideMenu } from "../../features/navigation/organisms/SideMenu";
import { Flex } from "../primitives/Flex";

import { Spacer } from "@react-client/common/primitives/Spacer";
import { setupGlobalGraphStyle } from "@react-client/features/json4u/lib/graph/layout";
import { px2num } from "@react-client/features/json4u/lib/utils";
import type { MyWorker } from "@react-client/features/json4u/lib/worker/worker";
import { useConfigFromCookies } from "@react-client/features/json4u/stores/hook";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useUserStore } from "@react-client/features/json4u/stores/userStore";
import { wrap } from "comlink";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

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
			new URL("../../features/json4u/lib/worker/worker.ts", import.meta.url),
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

		console.log("finished measuring graph base style:", measured);
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

const MainWrapper = styled("div", {
	shouldForwardProp: (prop) => prop !== "open",
})<{
	open?: boolean;
}>(({ theme }) => ({
	flexGrow: 1,
	padding: "6px 12px",
	backgroundColor: "#f5f6fa87",
	transition: theme.transitions.create("margin", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	marginLeft: `-${240}px`,
	variants: [
		{
			props: ({ open }) => open,
			style: {
				transition: theme.transitions.create("margin", {
					easing: theme.transitions.easing.easeOut,
					duration: theme.transitions.duration.enteringScreen,
				}),
				marginLeft: 0,
			},
		},
	],
}));

export function MainLayout({
	children,
	navbarVisible = true,
}: { children: React.ReactNode; navbarVisible?: boolean }) {
	const store = useGlobalSettingsStore();

	return (
		<Flex id="main_layout_container">
			<SideMenu open={store.isSideMenuVisible} />

			<MainWrapper id="main_layout_content" open={store.isSideMenuVisible}>
				<Spacer height={6} />
				<Header navbarVisible={navbarVisible} />
				<Spacer height={12} />
				{children}
			</MainWrapper>
			<WidthMeasure />
		</Flex>
	);
}
