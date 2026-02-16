import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import Breadcrumbs, { breadcrumbsClasses } from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { camelCase } from "lodash-es";
import { useLocation } from "react-router";
import { routes } from "../../../routing/routes";
import { useDataLineageStore } from "../../../stores/dataLineageStore";
import { useMemo } from "react";

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
	margin: theme.spacing(1, 0),
	[`& .${breadcrumbsClasses.separator}`]: {
		color: (theme.vars || theme).palette.action.disabled,
		margin: 1,
	},
	[`& .${breadcrumbsClasses.ol}`]: {
		alignItems: "center",
	},
}));

export function NavbarBreadcrumbs() {
	const location = useLocation();
	const { currentGraph } = useDataLineageStore();

	const breadcrumbInfo = useMemo(() => {
		const pathname = location.pathname;

		// Handle entity preview route
		if (pathname.startsWith("/entity/")) {
			const encodedEntityId = pathname.split("/entity/")[1];
			if (encodedEntityId) {
				const entityId = decodeURIComponent(encodedEntityId);

				// Try to find the entity in the current graph
				const entity = currentGraph?.entities?.find((e) => e.id === entityId);

				if (entity) {
					const entityName = entity.namespace
						? `${entity.namespace}.${entity.name}`
						: entity.name;
					return {
						breadcrumbs: [
							{ name: routes.entityPreview.name, isLink: false },
							{ name: entityName, isLink: false },
						],
					};
				} else {
					return {
						breadcrumbs: [
							{ name: routes.entityPreview.name, isLink: false },
							{ name: entityId, isLink: false },
						],
					};
				}
			}
		}

		// Handle changelog with graphId route
		if (pathname.startsWith("/changelog/")) {
			const graphId = pathname.split("/changelog/")[1];
			if (graphId) {
				const changelogRoute = (routes as Record<string, { name?: string }>)[
					"changelogTable"
				];
				return {
					breadcrumbs: [
						{ name: changelogRoute?.name ?? "Changelog", isLink: false },
						{ name: `График: ${graphId}`, isLink: false },
					],
				};
			}
		}

		// Handle other routes using the existing logic
		const path = camelCase(pathname.split("/", 3).join(" "));
		const pathName = routes[path as keyof typeof routes]?.name;
		const crumb = pathName ? pathName : !path ? routes.home.name : "";

		return {
			breadcrumbs: [{ name: crumb, isLink: false }],
		};
	}, [location.pathname, currentGraph]);

	return (
		<StyledBreadcrumbs
			aria-label="breadcrumb"
			separator={
				<NavigateNextRoundedIcon
					fontSize="small"
					data-test-id="navbar-breadcrumbs--NavigateNextRoundedIcon-0"
				/>
			}
			data-test-id="navbar-breadcrumbs--StyledBreadcrumbs-0"
		>
			{breadcrumbInfo.breadcrumbs.map((breadcrumb, index) => (
				<Typography
					key={index}
					variant="body1"
					sx={{
						color:
							index === breadcrumbInfo.breadcrumbs.length - 1
								? "text.primary"
								: "text.secondary",
						fontWeight:
							index === breadcrumbInfo.breadcrumbs.length - 1 ? 600 : 400,
					}}
					data-test-id={`navbar-breadcrumbs--Typography-${index}`}
				>
					{breadcrumb.name}
				</Typography>
			))}
		</StyledBreadcrumbs>
	);
}
