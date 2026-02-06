import { Box } from "@mui/material";
import type { FC } from "react";
import { useNavigate } from "react-router";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { S2tCommitEditor } from "./S2tCommitEditor";

export const S2tCommitCreatePage: FC = () => {
	const navigate = useNavigate();

	return (
		<Box>
			<Header title="Создание коммита / загрузка s2t" />

			<S2tCommitEditor
				active={true}
				onClose={() => navigate(-1)}
				showCloseButton={false}
			/>
		</Box>
	);
};
