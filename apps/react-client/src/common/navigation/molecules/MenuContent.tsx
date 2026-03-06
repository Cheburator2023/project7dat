import CallMissedOutgoingIcon from "@mui/icons-material/CallMissedOutgoing";
import { Box, Button, Divider } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import { useLocation, useNavigate } from "react-router";
import { navbarGroups, routes } from "@react-client/routing/routes";
import { IS_DEV } from "@react-client/common/constants";

type NavbarGroupKey = keyof typeof navbarGroups;

type RouteConfig = (typeof routes)[keyof typeof routes];

type RouteWithNavbar = RouteConfig & {
	navbar?: {
		group?: string;
		order?: number;
	};
	devOnly?: boolean;
};

const getNavbarItemsByGroup = (group: NavbarGroupKey) => {
	return (Object.values(routes) as RouteWithNavbar[])
		.filter((route) => route.showInNavbar)
		.filter((route) => route.navbar?.group === group)
		.filter((route) => !route.disabled)
		.filter((route) => !(route.devOnly && !IS_DEV))
		.sort((a, b) => (a.navbar?.order ?? 0) - (b.navbar?.order ?? 0));
};

const devOnlyItems = (Object.values(routes) as RouteWithNavbar[])
	.filter((route) => route.showInNavbar)
	.filter((route) => Boolean(route.devOnly) && IS_DEV)
	.filter((route) => !route.disabled)
	.sort((a, b) => (a.navbar?.order ?? 0) - (b.navbar?.order ?? 0));

const secondaryListItems = [
	{
		text: "sum",
		icon: (
			<CallMissedOutgoingIcon data-test-id="menu-content--CallMissedOutgoingIcon-0" />
		),
		tooltip: "Система управления моделями",
		path: "/sum",
	},
	{
		text: "sum-rm",
		icon: (
			<CallMissedOutgoingIcon data-test-id="menu-content--CallMissedOutgoingIcon-1" />
		),
		tooltip: "Рееcтр моделей",
		path: "/sum-rm",
	},
];

export function MenuContent() {
	const navigate = useNavigate();
	const location = useLocation();

	const handler = (path: string) => {
		navigate(path);
	};

	return (
		<Stack
			sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}
			data-test-id="menu-content--Stack-0"
		>
			<List data-test-id="menu-content--List-0">
				<ListItem
					disablePadding
					sx={{ display: "block", mb: 0.2 }}
					onClick={() => handler(routes.home.rootPath)}
					data-test-id="menu-content--ListItem-backend"
				>
					<ListItemButton
						selected={routes.home.rootPath === location.pathname}
						data-test-id="menu-content--ListItemButton-backend"
					>
						<ListItemText
							primary={routes.home.name}
							data-test-id="menu-content--ListItemText-backend"
						/>
					</ListItemButton>
				</ListItem>

				<Box
					sx={{ display: "block", mb: 0.2 }}
					data-test-id="menu-content--ListItem-backend"
				>
					<ListItemButton
						data-test-id="menu-content--ListItemButton-backend"
						disabled
					>
						<ListItemText
							// primary={navbarGroups.services.title}
							secondary={navbarGroups.services.title}
							data-test-id="menu-content--ListItemText-backend"
						/>
					</ListItemButton>

					<List disablePadding data-test-id="menu-content--List-0-services">
						{getNavbarItemsByGroup("services").map((route, index) => (
							<ListItem
								key={`services-${index}`}
								disablePadding
								sx={{
									display: "block",
									mb: 0.2,
									paddingBottom: 0,
									paddingTop: 0,
								}}
								onClick={() => handler(route.rootPath)}
								data-test-id="menu-content--ListItem-backend"
							>
								<ListItemButton
									selected={route.rootPath === location.pathname}
									data-test-id="menu-content--ListItemButton-backend"
								>
									<ListItemText
										primary={route.name}
										data-test-id="menu-content--ListItemText-backend"
									/>
								</ListItemButton>
							</ListItem>
						))}
					</List>
				</Box>

				<Box
					sx={{ display: "block", mb: 0.2 }}
					data-test-id="menu-content--ListItem-backend"
				>
					<ListItemButton
						data-test-id="menu-content--ListItemButton-backend"
						disabled
					>
						<ListItemText
							// primary={navbarGroups.import.title}
							secondary={navbarGroups.import.title}
							data-test-id="menu-content--ListItemText-backend"
						/>
					</ListItemButton>

					<List disablePadding data-test-id="menu-content--List-0-import">
						{getNavbarItemsByGroup("import").map((route, index) => (
							<ListItem
								key={`import-${index}`}
								disablePadding
								sx={{
									display: "block",
									mb: 0.2,
									paddingBottom: 0,
									paddingTop: 0,
								}}
								onClick={() => handler(route.rootPath)}
								data-test-id="menu-content--ListItem-backend"
							>
								<ListItemButton
									selected={route.rootPath === location.pathname}
									data-test-id="menu-content--ListItemButton-backend"
								>
									<ListItemText
										primary={route.name}
										data-test-id="menu-content--ListItemText-backend"
									/>
								</ListItemButton>
							</ListItem>
						))}
					</List>
				</Box>

				{devOnlyItems.length > 0 && (
					<>
						<Divider sx={{ my: 1 }} data-test-id="menu-content--Divider-0" />
						{devOnlyItems.map((item, index) => (
							<ListItem
								key={`dev-${index}`}
								disablePadding
								sx={{ display: "block", mb: 0.2 }}
								onClick={() => handler(item.rootPath)}
								data-test-id="menu-content--ListItem-dev"
							>
								<ListItemButton
									selected={item.rootPath === location.pathname}
									data-test-id="menu-content--ListItemButton-dev"
								>
									<ListItemText
										primary={item.name}
										data-test-id="menu-content--ListItemText-dev"
									/>
								</ListItemButton>
							</ListItem>
						))}
					</>
				)}
			</List>
			<List data-test-id="menu-content--List-1">
				{secondaryListItems.map((item, index) => (
					<ListItem
						key={index}
						disablePadding
						sx={{ paddingBottom: 1 }}
						data-test-id="menu-content--ListItem-1"
					>
						<div title={item.tooltip} data-test-id="menu-content--Tooltip-0">
							<Button
								size="small"
								variant="outlined"
								href={item.path}
								data-test-id="menu-content--Button-0"
							>
								<ListItemIcon data-test-id="menu-content--ListItemIcon-0">
									{item.icon}
								</ListItemIcon>
								<ListItemText
									primary={item.text}
									data-test-id="menu-content--ListItemText-1"
								/>
							</Button>
						</div>
					</ListItem>
				))}
			</List>
		</Stack>
	);
}
