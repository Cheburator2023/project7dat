import CallMissedOutgoingIcon from "@mui/icons-material/CallMissedOutgoing";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Button, Divider } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import { useLocation, useNavigate } from "react-router";
import { routes } from "@react-client/routing/routes";
import { useMergeStore } from "@react-client/stores/mergeStore";

// Классификация роутов по категориям меню (статический контекст)
const OLD_ROUTE_KEYS = [
	"home",
	"snapshots",
	"jsonData",
	"allCommits",
	"commitQueue",
	"changelog",
] as const;

const MOCKED_NEW_ROUTE_KEYS = [
	// "objects",
	// "models",
	"processes",
	"changelogTable",
] as const;

const nonDevEntries = Object.entries(routes).filter(
	([, route]) => route.showInNavbar && !(route as any).devOnly,
);

const _backendItems = nonDevEntries
	.filter(([key]: any) =>
		(OLD_ROUTE_KEYS as ReadonlyArray<string>).includes(key),
	)
	.map(([, route]) => route);

const mockedItems = nonDevEntries
	.filter(([key]: any) =>
		(MOCKED_NEW_ROUTE_KEYS as ReadonlyArray<string>).includes(key),
	)
	.map(([, route]) => route);

const devOnlyItems = Object.values(routes)
	.filter((route) => route.showInNavbar && (route as any).devOnly)
	.map((route) => route);

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
	// { text: "Настройки", icon: <SettingsRoundedIcon /> },
];

export function MenuContent() {
	const navigate = useNavigate();
	const location = useLocation();

	const {
		isMergeActive,
		confirmMerge,
		cancelMerge,
		openDemoMergeGraphWindow,
		openDemoDiffWindow,
	} = useMergeStore();

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
					onClick={() => handler(routes.home.rootPath.replace("/", ""))}
					data-test-id="menu-content--ListItem-backend"
				>
					<ListItemButton
						selected={
							routes.home.rootPath === location.pathname.replace("/", "")
						}
						data-test-id="menu-content--ListItemButton-backend"
					>
						<ListItemText
							primary={routes.home.name}
							data-test-id="menu-content--ListItemText-backend"
						/>
					</ListItemButton>
				</ListItem>

				<ListItem
					disablePadding
					sx={{ display: "block", mb: 0.2 }}
					data-test-id="menu-content--ListItem-backend"
				>
					<ListItemButton
						data-test-id="menu-content--ListItemButton-backend"
						disabled
					>
						<ListItemText
							primary={"Сервисы и продукты"}
							data-test-id="menu-content--ListItemText-backend"
						/>
					</ListItemButton>
					{/*<ListItem*/}
					{/*	sx={{ display: "block", mb: 0.2, paddingBottom: 0, paddingTop: 0 }}*/}
					{/*	onClick={() =>*/}
					{/*		handler(routes.modelServices.rootPath.replace("/", ""))*/}
					{/*	}*/}
					{/*	data-test-id="menu-content--ListItem-backend"*/}
					{/*>*/}
					{/*	<ListItemButton*/}
					{/*		selected={*/}
					{/*			routes.modelServices.rootPath ===*/}
					{/*			location.pathname.replace("/", "")*/}
					{/*		}*/}
					{/*		data-test-id="menu-content--ListItemButton-backend"*/}
					{/*	>*/}
					{/*		<ListItemText*/}
					{/*			primary={routes.modelServices.name}*/}
					{/*			data-test-id="menu-content--ListItemText-backend"*/}
					{/*		/>*/}
					{/*	</ListItemButton>*/}
					{/*</ListItem>*/}
					<ListItem
						sx={{ display: "block", mb: 0.2, paddingBottom: 0, paddingTop: 0 }}
						onClick={() => handler(routes.models.rootPath.replace("/", ""))}
						data-test-id="menu-content--ListItem-backend"
					>
						<ListItemButton
							selected={
								routes.models.rootPath === location.pathname.replace("/", "")
							}
							data-test-id="menu-content--ListItemButton-backend"
						>
							<ListItemText
								primary={routes.models.name}
								data-test-id="menu-content--ListItemText-backend"
							/>
						</ListItemButton>
					</ListItem>
					<ListItem
						sx={{ display: "block", mb: 0.2, paddingBottom: 0, paddingTop: 0 }}
						onClick={() => handler(routes.objects.rootPath.replace("/", ""))}
						data-test-id="menu-content--ListItem-backend"
					>
						<ListItemButton
							selected={
								routes.objects.rootPath === location.pathname.replace("/", "")
							}
							data-test-id="menu-content--ListItemButton-backend"
						>
							<ListItemText
								primary={routes.objects.name}
								data-test-id="menu-content--ListItemText-backend"
							/>
						</ListItemButton>
					</ListItem>
				</ListItem>

				<ListItem
					disablePadding
					sx={{ display: "block", mb: 0.2 }}
					data-test-id="menu-content--ListItem-backend"
				>
					<ListItemButton
						data-test-id="menu-content--ListItemButton-backend"
						disabled
					>
						<ListItemText
							primary={"Отчеты"}
							data-test-id="menu-content--ListItemText-backend"
						/>
					</ListItemButton>
					<ListItem
						sx={{ display: "block", mb: 0.2, paddingBottom: 0, paddingTop: 0 }}
						onClick={() => handler(routes.jsonData.rootPath.replace("/", ""))}
						data-test-id="menu-content--ListItem-backend"
					>
						<ListItemButton
							selected={
								routes.jsonData.rootPath === location.pathname.replace("/", "")
							}
							data-test-id="menu-content--ListItemButton-backend"
						>
							<ListItemText
								primary={routes.jsonData.name}
								data-test-id="menu-content--ListItemText-backend"
							/>
						</ListItemButton>
					</ListItem>
					<ListItem
						sx={{ display: "block", mb: 0.2, paddingBottom: 0, paddingTop: 0 }}
						onClick={() => handler(routes.s2tData.rootPath.replace("/", ""))}
						data-test-id="menu-content--ListItem-backend"
					>
						<ListItemButton
							selected={
								routes.s2tData.rootPath === location.pathname.replace("/", "")
							}
							data-test-id="menu-content--ListItemButton-backend"
						>
							<ListItemText
								primary={routes.s2tData.name}
								data-test-id="menu-content--ListItemText-backend"
							/>
						</ListItemButton>
					</ListItem>
				</ListItem>

				<ListItem
					disablePadding
					sx={{ display: "block", mb: 0.2 }}
					data-test-id="menu-content--ListItem-backend"
				>
					<ListItemButton
						data-test-id="menu-content--ListItemButton-backend"
						disabled
					>
						<ListItemText
							primary={"Импорт данных"}
							data-test-id="menu-content--ListItemText-backend"
						/>
					</ListItemButton>
					{/*<ListItem*/}
					{/*	sx={{ display: "block", mb: 0.2, paddingBottom: 0, paddingTop: 0 }}*/}
					{/*	onClick={() => handleImport("json")}*/}
					{/*	data-test-id="menu-content--ListItem-backend"*/}
					{/*>*/}
					{/*	<ListItemButton*/}
					{/*		selected={*/}
					{/*			routes.allCommits.rootPath ===*/}
					{/*			location.pathname.replace("/", "")*/}
					{/*		}*/}
					{/*		data-test-id="menu-content--ListItemButton-backend"*/}
					{/*	>*/}
					{/*		<ListItemText*/}
					{/*			primary={"Импорт JSON"}*/}
					{/*			data-test-id="menu-content--ListItemText-backend"*/}
					{/*		/>*/}
					{/*	</ListItemButton>*/}
					{/*</ListItem>*/}

					{/*<ListItem*/}
					{/*	sx={{ display: "block", mb: 0.2, paddingBottom: 0, paddingTop: 0 }}*/}
					{/*	onClick={() =>*/}
					{/*		handler(routes.commitQueue.rootPath.replace("/", ""))*/}
					{/*	}*/}
					{/*	data-test-id="menu-content--ListItem-backend"*/}
					{/*>*/}
					{/*	<ListItemButton*/}
					{/*		selected={*/}
					{/*			routes.commitQueue.rootPath ===*/}
					{/*			location.pathname.replace("/", "")*/}
					{/*		}*/}
					{/*		data-test-id="menu-content--ListItemButton-backend"*/}
					{/*	>*/}
					{/*		<ListItemText*/}
					{/*			primary={routes.commitQueue.name}*/}
					{/*			data-test-id="menu-content--ListItemText-backend"*/}
					{/*		/>*/}
					{/*	</ListItemButton>*/}
					{/*</ListItem>*/}
					<ListItem
						sx={{ display: "block", mb: 0.2, paddingBottom: 0, paddingTop: 0 }}
						onClick={() => handler(routes.allCommits.rootPath.replace("/", ""))}
						data-test-id="menu-content--ListItem-backend"
					>
						<ListItemButton
							selected={
								routes.allCommits.rootPath ===
								location.pathname.replace("/", "")
							}
							data-test-id="menu-content--ListItemButton-backend"
						>
							<ListItemText
								primary={routes.allCommits.name}
								data-test-id="menu-content--ListItemText-backend"
							/>
						</ListItemButton>
					</ListItem>
				</ListItem>
				<Divider sx={{ my: 1 }} data-test-id="menu-content--Divider-mocked" />

				{/*{backendItems.map((item, index) => (*/}
				{/*	<ListItem*/}
				{/*		key={`backend-${index}`}*/}
				{/*		disablePadding*/}
				{/*		sx={{ display: "block", mb: 0.2 }}*/}
				{/*		onClick={() => handler(item.rootPath.replace("/", ""))}*/}
				{/*		data-test-id="menu-content--ListItem-backend"*/}
				{/*	>*/}
				{/*		<ListItemButton*/}
				{/*			selected={item.rootPath === location.pathname.replace("/", "")}*/}
				{/*			data-test-id="menu-content--ListItemButton-backend"*/}
				{/*		>*/}
				{/*			<ListItemText*/}
				{/*				primary={item.name}*/}
				{/*				data-test-id="menu-content--ListItemText-backend"*/}
				{/*			/>*/}
				{/*		</ListItemButton>*/}
				{/*	</ListItem>*/}
				{/*))}*/}

				{mockedItems.map((item, index) => (
					<ListItem
						key={`mocked-${index}`}
						disablePadding
						sx={{ display: "block", mb: 0.2 }}
						onClick={() => handler(item.rootPath.replace("/", ""))}
						data-test-id="menu-content--ListItem-mocked"
					>
						<ListItemButton
							selected={item.rootPath === location.pathname.replace("/", "")}
							data-test-id="menu-content--ListItemButton-mocked"
						>
							<ListItemText
								primary={item.name}
								data-test-id="menu-content--ListItemText-mocked"
							/>
						</ListItemButton>
					</ListItem>
				))}
				{devOnlyItems.length > 0 && (
					<>
						<Divider sx={{ my: 1 }} data-test-id="menu-content--Divider-0" />
						{devOnlyItems.map((item, index) => (
							<ListItem
								key={`dev-${index}`}
								disablePadding
								sx={{ display: "block", mb: 0.2 }}
								onClick={() => handler(item.rootPath.replace("/", ""))}
								data-test-id="menu-content--ListItem-dev"
							>
								<ListItemButton
									selected={
										item.rootPath === location.pathname.replace("/", "")
									}
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

				{/* Разделы мерджа */}
				{isMergeActive && (
					<>
						<Divider
							sx={{ my: 1 }}
							data-test-id="menu-content--Divider-merge"
						/>
						<ListItem
							disablePadding
							sx={{ display: "block", mb: 0.2 }}
							onClick={confirmMerge}
							data-test-id="menu-content--ListItem-confirm"
						>
							<ListItemButton data-test-id="menu-content--ListItemButton-confirm">
								<ListItemIcon data-test-id="menu-content--ListItemIcon-confirm">
									<CheckIcon sx={{ color: "success.main" }} />
								</ListItemIcon>
								<ListItemText
									primary="Подтвердить"
									data-test-id="menu-content--ListItemText-confirm"
								/>
							</ListItemButton>
						</ListItem>
						<ListItem
							disablePadding
							sx={{ display: "block", mb: 0.2 }}
							onClick={cancelMerge}
							data-test-id="menu-content--ListItem-cancel"
						>
							<ListItemButton data-test-id="menu-content--ListItemButton-cancel">
								<ListItemIcon data-test-id="menu-content--ListItemIcon-cancel">
									<CloseIcon sx={{ color: "error.main" }} />
								</ListItemIcon>
								<ListItemText
									primary="Отменить"
									data-test-id="menu-content--ListItemText-cancel"
								/>
							</ListItemButton>
						</ListItem>
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
