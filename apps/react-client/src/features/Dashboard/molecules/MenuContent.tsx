import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import { useNavigate } from "react-router";
import { routes } from "../../../routing/routes";

const mainListItems = [
	{
		text: "Просмотр",
		icon: <HomeRoundedIcon />,
		path: routes.dashboard.rootPath,
	},
	{
		text: "Редактирование",
		icon: <AnalyticsRoundedIcon />,
		path: routes.standAloneEditor.rootPath,
	},
];

const secondaryListItems = [
	{ text: "Система управления моделями (СУМ)", icon: <InfoRoundedIcon /> },
	{ text: "Реестр моделей (СУМ РМ)", icon: <InfoRoundedIcon /> },
	{ text: "Настройки", icon: <SettingsRoundedIcon /> },
];

export function MenuContent() {
	const navigate = useNavigate();

	return (
		<Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
			<List dense>
				{mainListItems.map((item, index) => (
					<ListItem
						key={index}
						disablePadding
						sx={{ display: "block" }}
						onClick={() => navigate(item.path)}
					>
						<ListItemButton selected={index === 0}>
							<ListItemIcon>{item.icon}</ListItemIcon>
							<ListItemText primary={item.text} />
						</ListItemButton>
					</ListItem>
				))}
			</List>
			<List dense>
				{secondaryListItems.map((item, index) => (
					<ListItem key={index} disablePadding sx={{ display: "block" }}>
						<ListItemButton>
							<ListItemIcon>{item.icon}</ListItemIcon>
							<ListItemText primary={item.text} />
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</Stack>
	);
}
