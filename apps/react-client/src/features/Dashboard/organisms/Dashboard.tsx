import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid-pro/themeAugmentation";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-tree-view/themeAugmentation";
import {
	chartsCustomizations,
	dataGridCustomizations,
	datePickersCustomizations,
	treeViewCustomizations,
} from "../../../theme/customizations";
import { AppNavbar } from "../molecules/AppNavbar";
import { Header } from "../molecules/Header";
import { MainGrid } from "../molecules/MainGrid";
import { SideMenu } from "../molecules/SideMenu";

const xThemeComponents = {
	...chartsCustomizations,
	...dataGridCustomizations,
	...datePickersCustomizations,
	...treeViewCustomizations,
};

export function Dashboard(props: { disableCustomTheme?: boolean }) {
	return (
		<Box sx={{ display: "flex" }}>
			<SideMenu />
			<AppNavbar />
			{/* Main content */}
			<Box
				component="main"
				sx={(theme) => ({
					flexGrow: 1,
					backgroundColor: alpha(theme.palette.background.default, 1),
					overflow: "auto",
				})}
			>
				<Stack
					spacing={2}
					sx={{
						alignItems: "center",
						mx: 3,
						pb: 5,
						mt: { xs: 8, md: 0 },
					}}
				>
					<Header />
					<MainGrid />
				</Stack>
			</Box>
		</Box>
	);
}
