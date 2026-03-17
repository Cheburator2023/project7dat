import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography,
} from "@mui/material";
import { type FC, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { routes } from "@react-client/routing/routes";
import { S2tCommitEditor } from "../organisms/S2tCommitEditor";

export const S2tCommitCreatePage: FC = () => {
	const navigate = useNavigate();
	const [isReuseDialogOpen, setIsReuseDialogOpen] = useState(false);
	const [forceCreate, setForceCreate] = useState(false);

	const handleSaved = useCallback(
		(payload: { commitId: string; reusedExisting: boolean }) => {
			if (payload.reusedExisting) {
				setIsReuseDialogOpen(true);
				return;
			}

			navigate(routes.allCommits.rootPath);
		},
		[navigate],
	);

	const handleCloseReuseDialog = useCallback(() => {
		setIsReuseDialogOpen(false);
	}, []);

	const handleForceCreate = useCallback(() => {
		setIsReuseDialogOpen(false);
		setForceCreate(true);
	}, []);

	return (
		<Box>
			<Header title="Создание коммита / загрузка s2t" />

			<S2tCommitEditor
				active={true}
				onSaved={handleSaved}
				onClose={() => navigate(-1)}
				showCloseButton={false}
				forceCreate={forceCreate}
			/>
			<Dialog
				open={isReuseDialogOpen}
				onClose={handleCloseReuseDialog}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Изменения уже были применены</DialogTitle>
				<DialogContent>
					<Typography>
						Файл с таким именем уже был успешно применён ранее. Повторно
						изменения внесены не будут.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseReuseDialog}>Понятно</Button>
					<Button
						onClick={handleForceCreate}
						variant="contained"
						color="warning"
					>
						Всё равно продолжить
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};
