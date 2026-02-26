import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import MuiDrawer, { drawerClasses } from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled, useColorScheme } from "@mui/material/styles";
import { MenuContent } from "../molecules/MenuContent";
import { OptionsMenu } from "../molecules/OptionsMenu";
import { LogoDataLineage } from "@react-client/common/primitives/LogoDataLineage";
import { useUserStore } from "@react-client/common/stores/userStore";
import { Flex } from "@react-client/common/primitives/Flex";

const drawerWidth = 260;

const Drawer = styled(MuiDrawer)<{ mode?: string }>(({ mode }) => {
	return {
		width: drawerWidth,
		flexShrink: 0,
		boxSizing: "border-box",
		border: "none",
		backgroundColor: "transparent",
		backgroundImage: "none",
		boxShadow: "none",
		padding: "0px",
		[`& .${drawerClasses.paper}`]: {
			width: drawerWidth,
			border: "none",
			backgroundColor: "transparent",
			backgroundImage: "none",
			boxShadow: "none",
			boxSizing: "border-box",
			padding: "8px 0px 8px 8px",
		},
	};
});

const DrawerWrapper = styled(Flex)<{ mode?: string }>(({ mode }) => {
	return {
		flexShrink: 0,
		boxSizing: "border-box",
		backgroundColor: mode === "light" ? "#F5F6FA" : "#191b25",
		padding: "0px",
		borderRadius: "8px",
		border: "1px solid #7a7f894d",
	};
});

export function SideMenu({
	open = false,
	onLogout,
}: {
	open?: boolean;
	onLogout?: () => void;
}) {
	const { mode } = useColorScheme();
	const { user } = useUserStore();

	return (
		<Drawer variant="persistent" open={open} data-test-id="side-menu--Drawer-0">
			<DrawerWrapper mode={mode} flexDirection="column" height="100%">
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

				{user ? (
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
							title={`${user?.given_name} ${user?.family_name}`}
						>
							{`${user?.given_name.charAt(0)}${user?.family_name.charAt(0)}`}
						</Avatar>
						<Box sx={{ mr: "auto" }} data-test-id="side-menu--Box-1">
							<Typography
								variant="body2"
								sx={{ fontWeight: 500, lineHeight: "16px" }}
								data-test-id="side-menu--Typography-0"
							>
								{`${user?.given_name} ${user?.family_name}`}
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: "text.secondary" }}
								data-test-id="side-menu--Typography-1"
							>
								{user?.email}
							</Typography>
						</Box>
						<OptionsMenu
							onLogout={onLogout}
							data-test-id="side-menu--OptionsMenu-0"
						/>
					</Stack>
				) : null}
			</DrawerWrapper>
		</Drawer>
	);
}
