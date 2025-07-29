import { CircularProgress, StyledEngineProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";

import { MainLayout } from "@react-client/common/layouts/MainLayout";
import { NotificationDrawer } from "./features/notification/NotificationDrawer";
import { setupApiInterceptors } from "./api/apiInterceptor";
import { MfeBridge } from "./common/mfe/MfeBridge";

import { Routing } from "./routing";
import { AppTheme } from "./theme/AppTheme";
import {
	chartsCustomizations,
	dataGridCustomizations,
	datePickersCustomizations,
	treeViewCustomizations,
} from "./theme/customizations";

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

export function App() {
	useEffect(() => {
		setupApiInterceptors();
	}, []);

	return (
		<StyledEngineProvider injectFirst>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter>
					<AppTheme themeComponents={xThemeComponents as any}>
						<CssBaseline enableColorScheme />
						<Toaster position="bottom-right" richColors closeButton />
						<MfeBridge>
							<Suspense fallback={<CircularProgress />}>
								<LocalizationProvider dateAdapter={AdapterDateFns}>
									<MainLayout>
										<Routing />
									</MainLayout>
									<NotificationDrawer />
								</LocalizationProvider>
							</Suspense>
						</MfeBridge>
					</AppTheme>
				</BrowserRouter>
			</QueryClientProvider>
		</StyledEngineProvider>
	);
}
