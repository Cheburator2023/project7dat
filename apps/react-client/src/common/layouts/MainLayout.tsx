import { useEffect, useRef, useState, type ReactNode } from "react";
import { styled, useColorScheme } from "@mui/material/styles";
import { useGlobalSettingsStore } from "@react-client/common/stores/globalSettingsStore";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";
import { useMainDataLoadingStore } from "@react-client/common/stores/mainDataLoadingStore";
import { SideMenu } from "../navigation/organisms/SideMenu";
import { Flex } from "../primitives/Flex";

const MAIN_LAYOUT_LOADING_STATE_STORAGE_KEY = "main-layout-loading-state";
const DEFAULT_SIDEBAR_WIDTH = 260;

type MainLayoutLoadingState = {
	progress: number;
	isLoaderVisible: boolean;
	updatedAt: number;
};

const MainWrapper = styled("div", {
	shouldForwardProp: (prop) => prop !== "open",
})<{
	open?: boolean;
	mode?: string;
}>(({ theme, mode, open }) => ({
	flexGrow: 1,
	minHeight: "100vh",
	height: "100vh",
	width: `calc(100vw - ${open ? DEFAULT_SIDEBAR_WIDTH : 0}px)`,
	marginLeft: !open ? `-${DEFAULT_SIDEBAR_WIDTH}px !important` : 0,
	padding: "8px",
	position: "relative",
	transition: theme.transitions.create("margin", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	"& > div": {
		height: "100%",
		display: "flex",
		flexDirection: "column",
	},
	// backgroundColor: "#9fa6c326",
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
	onLogout,
}: {
	children?: ReactNode;
	navbarVisible?: boolean;
	onLogout?: () => void;
}) {
	const store = useGlobalSettingsStore();
	const { setMainDataLoading, markMainDataLoadedOnce, hasMainDataLoadedOnce } =
		useMainDataLoadingStore();
	const { mode } = useColorScheme();

	const isInitialLoading = false;
	const isRefetching = false;
	const wasInitialLoadingRef = useRef(false);

	useEffect(() => {
		setMainDataLoading(isRefetching);
		if (wasInitialLoadingRef.current && !isInitialLoading) {
			markMainDataLoadedOnce();
		}
		wasInitialLoadingRef.current = isInitialLoading;
	}, [
		isInitialLoading,
		isRefetching,
		markMainDataLoadedOnce,
		setMainDataLoading,
	]);

	const [progress, setProgress] = useState(() => {
		try {
			const raw = localStorage.getItem(MAIN_LAYOUT_LOADING_STATE_STORAGE_KEY);
			if (!raw) return 0;
			const parsed = JSON.parse(raw) as Partial<MainLayoutLoadingState>;
			return typeof parsed.progress === "number" ? parsed.progress : 0;
		} catch {
			return 0;
		}
	});
	const [isLoaderVisible, setIsLoaderVisible] = useState(() => {
		try {
			const raw = localStorage.getItem(MAIN_LAYOUT_LOADING_STATE_STORAGE_KEY);
			if (!raw) return false;
			const parsed = JSON.parse(raw) as Partial<MainLayoutLoadingState>;
			return parsed.isLoaderVisible === true;
		} catch {
			return false;
		}
	});

	useEffect(() => {
		if (!isLoaderVisible) {
			try {
				localStorage.removeItem(MAIN_LAYOUT_LOADING_STATE_STORAGE_KEY);
			} catch {
				// ignore
			}
			return;
		}

		if (progress >= 100) {
			try {
				localStorage.removeItem(MAIN_LAYOUT_LOADING_STATE_STORAGE_KEY);
			} catch {
				// ignore
			}
			return;
		}

		try {
			const stateToSave: MainLayoutLoadingState = {
				progress,
				isLoaderVisible,
				updatedAt: Date.now(),
			};
			localStorage.setItem(
				MAIN_LAYOUT_LOADING_STATE_STORAGE_KEY,
				JSON.stringify(stateToSave),
			);
		} catch {
			// ignore
		}
	}, [progress, isLoaderVisible]);

	useEffect(() => {
		if (hasMainDataLoadedOnce) {
			if (isLoaderVisible) {
				setIsLoaderVisible(false);
				setProgress(0);
			}
			try {
				localStorage.removeItem(MAIN_LAYOUT_LOADING_STATE_STORAGE_KEY);
			} catch {
				// ignore
			}
			return;
		}

		if (isInitialLoading) {
			if (!isLoaderVisible) {
				setIsLoaderVisible(true);
				setProgress(0);
			}
			const duration = 60000;
			const interval = 50;
			const increment = (interval / duration) * 50;

			const timer = window.setInterval(() => {
				setProgress((prev) => {
					const next = prev + increment;
					return next >= 99 ? 99 : next;
				});
			}, interval);

			return () => window.clearInterval(timer);
		}

		if (!isLoaderVisible) {
			return;
		}

		let finishTimer: number | null = null;
		let hideTimer: number | null = null;

		finishTimer = window.setInterval(() => {
			setProgress((prev) => {
				const next = prev + 2;
				if (next >= 100) {
					if (finishTimer) window.clearInterval(finishTimer);
					finishTimer = null;
					hideTimer = window.setTimeout(() => {
						setIsLoaderVisible(false);
						setProgress(0);
					}, 100);
					return 100;
				}
				return next;
			});
		}, 20);

		return () => {
			if (finishTimer) window.clearInterval(finishTimer);
			if (hideTimer) window.clearTimeout(hideTimer);
		};
	}, [hasMainDataLoadedOnce, isInitialLoading, isLoaderVisible]);

	return (
		<Flex id="main_layout_container" data-test-id="main-layout--Flex-0">
			<SideMenu
				open={store.isSideMenuVisible}
				onLogout={onLogout}
				data-test-id="main-layout--SideMenu-0"
			/>
			<MainWrapper
				id="main_layout_content"
				open={store.isSideMenuVisible}
				mode={mode}
				data-test-id="main-layout--MainWrapper-0"
			>
				{children}
				{/* <LoadingOverlay open={isLoaderVisible} progress={progress} /> */}
			</MainWrapper>
		</Flex>
	);
}
