import { CircularProgress } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { Routing } from "./routing";
// import {Routing} from "routing";
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
	return (
		<QueryClientProvider client={queryClient}>
			<AppTheme themeComponents={xThemeComponents}>
				<CssBaseline enableColorScheme />
				<Suspense fallback={<CircularProgress />}>
					<Routing />
				</Suspense>
			</AppTheme>
		</QueryClientProvider>
	);
}
