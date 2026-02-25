import { Box } from "@mui/material";
import type { FC } from "react";
import { useNavigate } from "react-router";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { routes } from "@react-client/routing/routes";
import { S2tCommitEditor } from "../organisms/S2tCommitEditor";

export const S2tCommitCreatePage: FC = () => {
	const navigate = useNavigate();

	return (
		<Box>
			<Header title="Создание коммита / загрузка s2t" />

			<S2tCommitEditor
				active={true}
				onSaved={() => navigate(routes.allCommits.rootPath)}
				onClose={() => navigate(-1)}
				showCloseButton={false}
			/>
		</Box>
	);
};
