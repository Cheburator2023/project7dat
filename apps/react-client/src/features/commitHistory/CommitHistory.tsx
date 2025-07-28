import React from "react";
import {
	Box,
	Typography,
	List,
	ListItem,
	Chip,
	CircularProgress,
} from "@mui/material";
import { useCommitList } from "@react-client/hooks/api/useJsonData";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { Card } from "@react-client/common/muiCustom/Card";

export const CommitHistory: React.FC = () => {
	const { currentGraphId } = useDataLineageStore();
	console.log(
		"🐸 Pepe said >> CommitHistory >> currentGraphId:",
		currentGraphId,
	);

	const {
		data: commitData,
		isLoading,
		error,
	} = useCommitList({
		graphId: currentGraphId || undefined,
		limit: 20,
	});

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" p={2}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box p={2}>
				<Typography color="error">
					Ошибка загрузки истории: {error.message}
				</Typography>
			</Box>
		);
	}

	if (!commitData?.data?.length) {
		return (
			<Box p={2}>
				<Typography color="text.secondary">История коммитов пуста</Typography>
			</Box>
		);
	}

	return (
		<List>
			{commitData.data.map((commit) => (
				<ListItem key={commit.id} sx={{ px: 0 }}>
					<Card sx={{ width: "100%", p: 2 }}>
						<Box display="flex" alignItems="center" gap={1} mb={1}>
							<Chip
								label={commit.hash.substring(0, 8)}
								size="small"
								variant="outlined"
							/>
							<Typography variant="caption" color="text.secondary">
								{new Date(commit.createdAt).toLocaleString("ru-RU")}
							</Typography>
						</Box>
						<Typography variant="body1" gutterBottom>
							{commit.message}
						</Typography>
						{commit.diff && (
							<Box
								sx={{
									mt: 1,
									p: 1,
									bgcolor: "grey.50",
									borderRadius: 1,
									maxHeight: 200,
									overflow: "auto",
								}}
							>
								<Typography variant="caption" component="pre">
									{JSON.stringify(commit.diff, null, 2)}
								</Typography>
							</Box>
						)}
					</Card>
				</ListItem>
			))}
		</List>
	);
};
