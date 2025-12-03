import React, { memo, useMemo } from "react";
import { Box, Typography, Chip, useColorScheme } from "@mui/material";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import type { JsonCommitItem } from "@react-client/api/hooks/jsonDataApi";
import { Card } from "@react-client/common/muiCustom/Card";
import { fastStringify } from "@react-client/shared/src";
import { ChangesSummaryBadge } from "./ChangesSummaryBadge";

interface CommitCardProps {
	commit: JsonCommitItem;
	onClick?: (commitId: string) => void;
	showDiff?: boolean;
	compact?: boolean;
}

/**
 * Карточка коммита с отображением изменений
 */
export const CommitCard: React.FC<CommitCardProps> = memo(
	({ commit, onClick, showDiff = true, compact = false }) => {
		const { mode } = useColorScheme();

		const oldValue = useMemo(
			() => (commit.diff ? fastStringify(commit.diff.left, { space: 2 }) : ""),
			[commit.diff],
		);

		const newValue = useMemo(
			() => (commit.diff ? fastStringify(commit.diff.right, { space: 2 }) : ""),
			[commit.diff],
		);

		const authorDisplay = useMemo(() => {
			if (commit.author) {
				return (
					commit.author.username || commit.author.email || commit.author.id
				);
			}
			return commit.authorName || "—";
		}, [commit.author, commit.authorName]);

		const hasDiffContent =
			commit.diff?.left && Object.keys(commit.diff.left).length > 0;
		const isInitialCommit =
			!commit.diff?.left || Object.keys(commit.diff.left).length === 0;

		return (
			<Card
				sx={{
					width: "100%",
					p: compact ? 1.5 : 2,
					cursor: onClick ? "pointer" : "default",
					"&:hover": onClick
						? {
								backgroundColor: "action.hover",
							}
						: {},
				}}
				zoom={compact ? 0.8 : 0.7}
				uuid={"card_commit_" + commit.id}
				onClick={() => onClick?.(commit.id)}
			>
				{/* Header */}
				<Box
					display="flex"
					alignItems="center"
					justifyContent="space-between"
					gap={1}
					mb={1}
				>
					<Box display="flex" alignItems="center" gap={1}>
						<Chip label={commit.short_id} size="small" variant="outlined" />
						<Typography variant="caption" color="text.secondary">
							{new Date(commit.createdAt).toLocaleString("ru-RU")}
						</Typography>
					</Box>
					{commit.changes && (
						<ChangesSummaryBadge changes={commit.changes} compact />
					)}
				</Box>

				{/* Message */}
				<Typography variant="body1" gutterBottom>
					{commit.message}
				</Typography>

				{/* Author */}
				{!compact && (
					<Typography variant="caption" color="text.secondary" display="block">
						Автор: {authorDisplay}
					</Typography>
				)}

				{/* Changes Summary */}
				{!compact && commit.changes && (
					<Box sx={{ mt: 1 }}>
						<ChangesSummaryBadge changes={commit.changes} />
					</Box>
				)}

				{/* Diff View */}
				{showDiff && !compact && hasDiffContent && (
					<Box sx={{ mt: 1, height: "200px", overflow: "auto" }}>
						<ReactDiffViewer
							oldValue={oldValue}
							newValue={newValue}
							splitView={true}
							compareMethod={DiffMethod.WORDS}
							leftTitle="Старая версия"
							rightTitle="Новая версия"
							useDarkTheme={mode === "dark"}
							styles={{
								variables: {
									light: {
										diffViewerBackground: "#fafafa",
										diffViewerColor: "#212121",
										addedBackground: "#e8f5e8",
										addedColor: "#24292e",
										removedBackground: "#ffecec",
										removedColor: "#24292e",
										wordAddedBackground: "#acf2bd",
										wordRemovedBackground: "#fdb8c0",
										addedGutterBackground: "#cdffd8",
										removedGutterBackground: "#fdbdcc",
										gutterBackground: "#f7f7f7",
										gutterBackgroundDark: "#f3f1f1",
										highlightBackground: "#fffbdd",
										highlightGutterBackground: "#ffcd3c",
										codeFoldGutterBackground: "#dbedff",
										codeFoldBackground: "#f1f8ff",
										emptyLineBackground: "#fafbfc",
										gutterColor: "#212121",
										addedGutterColor: "#212121",
										removedGutterColor: "#212121",
										codeFoldContentColor: "#212121",
										diffViewerTitleBackground: "#fafbfc",
										diffViewerTitleColor: "#212121",
										diffViewerTitleBorderColor: "#eee",
									},
								},
							}}
						/>
					</Box>
				)}

				{/* Initial Commit Notice */}
				{showDiff && !compact && isInitialCommit && (
					<Card sx={{ mt: 1, p: 1 }}>
						<Typography variant="body2" fontStyle="italic">
							Начальный коммит - нет предыдущей версии для сравнения
						</Typography>
					</Card>
				)}
			</Card>
		);
	},
);

CommitCard.displayName = "CommitCard";
