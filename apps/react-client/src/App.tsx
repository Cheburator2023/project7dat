import "./theme/global.css";
import "flexlayout-react/style/light.css";
import "@xyflow/react/dist/style.css";
import "@fontsource/inter";

import { CircularProgress, StyledEngineProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { enableMapSet } from "immer";

import { MainLayout } from "@react-client/common/layouts/MainLayout";
import { NotificationDrawer } from "./common/notification/NotificationDrawer";

import { setupApiInterceptors } from "./api/apiInterceptor";

import { Routing } from "./routing";
import { AppTheme } from "./theme/AppTheme";
import {
	chartsCustomizations,
	dataGridCustomizations,
	datePickersCustomizations,
	treeViewCustomizations,
} from "./theme/customizations";

enableMapSet();

const xThemeComponents = {
	...chartsCustomizations,
	...dataGridCustomizations,
	...datePickersCustomizations,
	...treeViewCustomizations,
};

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: false,
			staleTime: 1000 * 20, // 20 seoncds
			gcTime: 1000 * 60 * 5, //  5 minutes
		},
	},
});

interface AppProps {
	bridged?: boolean;
	token?: string;
	keycloak?: any;
	user?: any & {
		family_name: string;
		given_name: string;
		realm_access: {
			roles: string[];
		};
		groups: string[];
		roles: string[];
		preferred_username: string;
	};
	onLogout?: () => void;
}

export function App({ bridged, user, onLogout, keycloak }: AppProps) {
	useEffect(() => {}, [bridged, user, onLogout, keycloak]);

	console.log("MfeRoot >> bridged DL:", !!bridged);

	const _onLogoutHandler = () => {
		if (onLogout || keycloak) {
			keycloak.logout({ redirectUri: window.location.origin });
			onLogout?.();
		}
		localStorage.removeItem("currentCustomer");
	};

	useEffect(() => {
		setupApiInterceptors();
	}, []);

	return (
		<StyledEngineProvider injectFirst>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter basename={bridged ? "/dataLineage" : "/"}>
					<AppTheme themeComponents={xThemeComponents as any}>
						<CssBaseline enableColorScheme />
						<Toaster position="bottom-right" richColors closeButton />
						<Suspense fallback={<CircularProgress />}>
							<LocalizationProvider dateAdapter={AdapterDateFns}>
								<MainLayout onLogout={_onLogoutHandler}>
									<Routing />
								</MainLayout>
								<NotificationDrawer />
							</LocalizationProvider>
						</Suspense>
					</AppTheme>
				</BrowserRouter>
			</QueryClientProvider>
		</StyledEngineProvider>
	);
}
