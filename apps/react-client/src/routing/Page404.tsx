import { Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { Spacer } from "@nextui-org/react";
import { useNavigate } from "react-router";

import { Flex } from "../common/primitives/Flex";
import { routes } from "./routes";

export const Page404 = () => {
	const navigate = useNavigate();
	return (
		<Flex
			width="100vw"
			height="100vh"
			alignItems="center"
			justifyContent="center"
		>
			<Flex flexDirection="column" alignItems="center">
				<Typography variant="h4">Страница не найдена</Typography>
				<Spacer />
				<Button
					color="primary"
					variant="contained"
					onClick={() => navigate(routes.home.rootPath)}
				>
					На главную
				</Button>
			</Flex>
		</Flex>
	);
};
