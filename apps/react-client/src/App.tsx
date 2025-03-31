import { CircularProgress } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
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

export function App() {
	return (
		<AppTheme themeComponents={xThemeComponents}>
			<CssBaseline enableColorScheme />
			<Suspense fallback={<CircularProgress />}>
				<Routing />
			</Suspense>
		</AppTheme>
	);
}
