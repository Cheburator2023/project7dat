import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import MuiDrawer, { drawerClasses } from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled, useColorScheme } from "@mui/material/styles";
import { useAuthStore } from "@react-client/common/store/authStore";
import { MenuContent } from "../molecules/MenuContent";
import { OptionsMenu } from "../molecules/OptionsMenu";
import { LogoDataLineage } from "@react-client/common/primitives/LogoDataLineage";

const drawerWidth = 260;

const Drawer = styled(MuiDrawer)<{ mode?: string }>(({ mode }) => {
	return {
		width: drawerWidth,
		flexShrink: 0,
		boxSizing: "border-box",
		[`& .${drawerClasses.paper}`]: {
			width: drawerWidth,
			backgroundColor: mode === "light" ? "#F5F6FA" : "#191b25",
			boxSizing: "border-box",
		},
	};
});

export function SideMenu({
	open = false,
	onLogout,
}: {
	open?: boolean;
	onLogout?: () => void;
}) {
	const { mode, systemMode, setMode } = useColorScheme();
	const { userInfo, isAuthenticated } = useAuthStore();

	return (
		<StyledDrawer
			variant="persistent"
			open={open}
			mode={mode}
			data-test-id="side-menu--Drawer-0"
		>
			<LogoDataLineage />

			<Box
				sx={{
					overflow: "auto",
					height: "100%",
					display: "flex",
					flexDirection: "column",
				}}
				data-test-id="side-menu--Box-0"
			>
				<MenuContent data-test-id="side-menu--MenuContent-0" />
			</Box>
			{isAuthenticated && userInfo && (
				<Stack
					direction="row"
					sx={{
						p: 2,
						gap: 1,
						alignItems: "center",
						borderTop: "1px solid",
						borderColor: "divider",
					}}
					data-test-id="side-menu--Stack-0"
				>
					<Avatar
						sizes="small"
						sx={{ width: 36, height: 36 }}
						data-test-id="side-menu--Avatar-0"
						title={`${userInfo.firstName} ${userInfo.lastName}`}
					>
						{`${userInfo.firstName.charAt(0)}${userInfo.lastName.charAt(0)}`}
					</Avatar>
					<Box sx={{ mr: "auto" }} data-test-id="side-menu--Box-1">
						<Typography
							variant="body2"
							sx={{ fontWeight: 500, lineHeight: "16px" }}
							data-test-id="side-menu--Typography-0"
						>
							{`${userInfo.firstName} ${userInfo.lastName}`}
						</Typography>
						<Typography
							variant="caption"
							sx={{ color: "text.secondary" }}
							data-test-id="side-menu--Typography-1"
						>
							{userInfo.email}
						</Typography>
					</Box>
					<OptionsMenu
						onLogout={onLogout}
						data-test-id="side-menu--OptionsMenu-0"
					/>
				</Stack>
			)}
		</StyledDrawer>
	);
}

const StyledDrawer = styled(Drawer)`
`;
