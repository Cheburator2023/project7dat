import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import MuiDrawer, { drawerClasses } from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { LogoDataLineage } from "../../../common/primitives/LogoDataLineage";
import { MenuContent } from "../molecules/MenuContent";
import { OptionsMenu } from "../molecules/OptionsMenu";

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
	width: drawerWidth,
	flexShrink: 0,
	boxSizing: "border-box",
	mt: 10,
	[`& .${drawerClasses.paper}`]: {
		width: drawerWidth,
		boxSizing: "border-box",
	},
});

export function SideMenu({ open = false }) {
	return (
		<Drawer
			variant="persistent"
			open={open}
			sx={{
				display: { md: "block" },
				[`& .${drawerClasses.paper}`]: {
					backgroundColor: "background.paper",
				},
			}}
		>
			{/* <Box
				sx={{
					display: "flex",
					mt: "calc(var(--template-frame-height, 0px) + 4px)",
					p: 1.5,
				}}
			>
				<SelectContent />
			</Box> */}
			<LogoDataLineage />
			<Box
				sx={{
					overflow: "auto",
					height: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<MenuContent />
			</Box>
			<Stack
				direction="row"
				sx={{
					p: 2,
					gap: 1,
					alignItems: "center",
					borderTop: "1px solid",
					borderColor: "divider",
				}}
			>
				<Avatar
					sizes="small"
					alt="Useroslav Userov"
					src="/static/images/avatar/7.jpg"
					sx={{ width: 36, height: 36 }}
				/>
				<Box sx={{ mr: "auto" }}>
					<Typography
						variant="body2"
						sx={{ fontWeight: 500, lineHeight: "16px" }}
					>
						Useroslav Userov
					</Typography>
					<Typography variant="caption" sx={{ color: "text.secondary" }}>
						ssUserov@vtb.com
					</Typography>
				</Box>
				<OptionsMenu />
			</Stack>
		</Drawer>
	);
}
