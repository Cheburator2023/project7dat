import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";

interface CommitQueueItem {
	id: string;
	name: string;
	author: string;
	status: "validated" | "not_validated" | "processing" | "error";
	uploadDate: string;
	fileType: string;
	description?: string;
	fileName?: string;
	fileSize?: number;
	processName?: string;
}

interface QueueVisualizationProps {
	commits: CommitQueueItem[];
}

const getStatusColor = (status: string) => {
	switch (status) {
		case "validated":
			return "#4caf50";
		case "not_validated":
			return "#f44336";
		case "processing":
			return "#ff9800";
		case "error":
			return "#f44336";
		default:
			return "#9e9e9e";
	}
};

const getStatusText = (status: string) => {
	switch (status) {
		case "validated":
			return "Валидирован";
		case "not_validated":
			return "Не валидирован";
		case "processing":
			return "Обработка";
		case "error":
			return "Ошибка";
		default:
			return status;
	}
};

export const QueueVisualization: React.FC<QueueVisualizationProps> = ({
	commits,
}) => {
	// Сортируем коммиты по дате загрузки (старые сверху) для правильного порядка мерджа
	const sortedCommits = [...commits].sort(
		(a, b) =>
			new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime(),
	);

	// Показываем все коммиты в очереди мерджа независимо от статуса валидации
	const queueCommits = sortedCommits;

	return (
		<Box
			sx={{
				width: 200,
				minHeight: "100%",
				padding: 2,
				backgroundColor: "background.paper",
				borderRadius: 1,
				border: "1px solid",
				borderColor: "divider",
				position: "sticky",
				top: 20,
			}}
		>
			<Flex flexDirection="column" alignItems="center" gap={0}>
				{/* Текущие данные - ключевая нода */}
				<Box
					sx={{
						position: "relative",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<Box
						sx={{
							width: 50,
							height: 50,
							borderRadius: "50%",
							backgroundColor: "primary.main",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							border: "2px solid",
							borderColor: "primary.main",
						}}
					>
						<Typography
							variant="body2"
							sx={{
								color: "white",
								fontWeight: 500,
								fontSize: "12px",
							}}
						>
							MAIN
						</Typography>
					</Box>
					<Typography
						variant="caption"
						sx={{
							mt: 1,
							textAlign: "center",
							fontWeight: 400,
							color: "text.secondary",
							fontSize: "11px",
						}}
					>
						Текущие данные
					</Typography>

					{/* Линия вниз к первому коммиту */}
					{queueCommits.length > 0 && (
						<Box
							sx={{
								width: 2,
								height: 40,
								backgroundColor: "divider",
								mt: 1.5,
							}}
						/>
					)}
				</Box>

				{/* Коммиты в очереди */}
				{queueCommits.map((commit, index) => (
					<Box
						key={commit.id}
						sx={{
							position: "relative",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}
					>
						{/* Узел коммита */}
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: "50%",
								backgroundColor: getStatusColor(commit.status),
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								border: "2px solid",
								borderColor: getStatusColor(commit.status),
								position: "relative",
							}}
						>
							<Typography
								variant="body2"
								sx={{
									color: "white",
									fontWeight: 500,
									fontSize: "12px",
								}}
							>
								{index + 1}
							</Typography>

							{/* Порядковый номер в очереди */}
							{index === 0 && (
								<Box
									sx={{
										position: "absolute",
										top: -8,
										right: -8,
										width: 18,
										height: 18,
										borderRadius: "50%",
										backgroundColor: "#ff5722",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: "10px",
										color: "white",
										fontWeight: 500,
										border: "1px solid white",
									}}
								>
									!
								</Box>
							)}
						</Box>

						{/* Информация о коммите */}
						<Box sx={{ mt: 1.5, textAlign: "center", maxWidth: 200 }}>
							<Typography
								variant="caption"
								sx={{
									fontWeight: 500,
									display: "block",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									fontSize: "11px",
									color: "text.primary",
								}}
							>
								{commit.name}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: "block", fontSize: "10px", mt: 0.5 }}
							>
								{commit.author}
							</Typography>
							<Chip
								label={getStatusText(commit.status)}
								size="small"
								sx={{
									height: 16,
									fontSize: "9px",
									mt: 0.5,
									backgroundColor: getStatusColor(commit.status),
									color: "white",
									fontWeight: 400,
								}}
							/>
						</Box>

						{/* Линия к следующему коммиту */}
						{index < queueCommits.length - 1 && (
							<Box
								sx={{
									width: 2,
									height: 40,
									backgroundColor: "divider",
									mt: 1.5,
								}}
							/>
						)}
					</Box>
				))}

				{/* Сообщение если нет коммитов */}
				{queueCommits.length === 0 && (
					<Box
						sx={{
							textAlign: "center",
							mt: 3,
							p: 2,
							borderRadius: 1,
							border: "1px dashed",
							borderColor: "divider",
						}}
					>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
							Нет коммитов в очереди
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Коммиты появятся здесь
						</Typography>
					</Box>
				)}

				{/* Статистика */}
				<Box
					sx={{
						mt: 3,
						p: 2,
						backgroundColor: "background.default",
						borderRadius: 1,
						width: "100%",
						border: "1px solid",
						borderColor: "divider",
					}}
				>
					<Typography
						variant="subtitle2"
						sx={{
							fontWeight: 500,
							mb: 1,
							color: "text.primary",
							fontSize: "12px",
						}}
					>
						Статистика
					</Typography>
					<Flex flexDirection="column" gap={0.5}>
						<Flex justifyContent="space-between" alignItems="center">
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ fontSize: "11px" }}
							>
								Всего коммитов:
							</Typography>
							<Typography
								variant="caption"
								color="text.primary"
								sx={{ fontWeight: 500 }}
							>
								{commits.length}
							</Typography>
						</Flex>
						<Flex justifyContent="space-between" alignItems="center">
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ fontSize: "11px" }}
							>
								В очереди:
							</Typography>
							<Typography
								variant="caption"
								color="text.primary"
								sx={{ fontWeight: 500 }}
							>
								{queueCommits.length}
							</Typography>
						</Flex>
						<Flex justifyContent="space-between" alignItems="center">
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ fontSize: "11px" }}
							>
								Требуют валидации:
							</Typography>
							<Typography
								variant="caption"
								color="text.primary"
								sx={{ fontWeight: 500 }}
							>
								{
									commits.filter(
										(c) => c.status === "not_validated" || c.status === "error",
									).length
								}
							</Typography>
						</Flex>
					</Flex>
				</Box>
			</Flex>
		</Box>
	);
};
