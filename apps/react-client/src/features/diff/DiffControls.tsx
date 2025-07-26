import { Button, Stack, Typography } from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";

export const DiffControls = () => {
	const { hasUnsavedChanges, discardChanges, commitChanges } =
		useDataLineageStore();

	if (!hasUnsavedChanges) {
		return (
			<Stack spacing={2} padding={2}>
				<Typography variant="body2" color="text.secondary">
					Нет несохранённых изменений
				</Typography>
			</Stack>
		);
	}

	return (
		<Stack spacing={2} padding={2} direction="row">
			<Button
				variant="outlined"
				color="error"
				onClick={discardChanges}
				size="small"
			>
				Отменить изменения
			</Button>
			<Button
				variant="contained"
				color="primary"
				onClick={commitChanges}
				size="small"
			>
				Сохранить изменения
			</Button>
		</Stack>
	);
};
