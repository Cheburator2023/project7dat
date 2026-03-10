import { memo } from "react";
import type { FC } from "react";
import { Box, Button, Typography } from "@mui/material";
import {
	formatDiffPathForDisplay,
	toPreview,
	getInlineStringDiff,
} from "../diffWorker";
import type { DiffChangeItem } from "../diffWorker";

interface DiffChangeRowProps {
	change: DiffChangeItem;
	onJumpToPath?: (path: string) => void;
}

const InlineStringDiff: FC<{ before: string; after: string }> = ({
	before,
	after,
}) => {
	const parts = getInlineStringDiff(before, after);
	return (
		<Box
			component="span"
			sx={{
				fontFamily: "monospace",
				fontSize: "0.8rem",
				wordBreak: "break-all",
			}}
		>
			{parts.map((part, idx) => {
				if (part.type === "same") {
					return <span key={idx}>{part.text}</span>;
				}
				if (part.type === "removed") {
					return (
						<Box
							component="span"
							key={idx}
							sx={{
								backgroundColor: "rgba(211, 47, 47, 0.15)",
								color: "error.dark",
								textDecoration: "line-through",
								borderRadius: "2px",
								px: 0.3,
							}}
						>
							{part.text}
						</Box>
					);
				}
				return (
					<Box
						component="span"
						key={idx}
						sx={{
							backgroundColor: "rgba(46, 125, 50, 0.15)",
							color: "success.dark",
							borderRadius: "2px",
							px: 0.3,
						}}
					>
						{part.text}
					</Box>
				);
			})}
		</Box>
	);
};

const ValueBlock: FC<{
	value: unknown;
	color: "red" | "green" | "neutral";
}> = ({ value, color }) => {
	const bgColor =
		color === "red"
			? "rgba(211, 47, 47, 0.08)"
			: color === "green"
				? "rgba(46, 125, 50, 0.08)"
				: "transparent";
	const textColor =
		color === "red"
			? "error.dark"
			: color === "green"
				? "success.dark"
				: "text.primary";

	const preview = toPreview(value);

	return (
		<Box
			sx={{
				backgroundColor: bgColor,
				border: "1px solid",
				borderColor:
					color === "red"
						? "rgba(211,47,47,0.3)"
						: color === "green"
							? "rgba(46,125,50,0.3)"
							: "divider",
				borderRadius: 1,
				px: 1,
				py: 0.5,
				fontFamily: "monospace",
				fontSize: "0.8rem",
				whiteSpace: "pre-wrap",
				wordBreak: "break-all",
				color: textColor,
				flex: 1,
				minWidth: 0,
			}}
		>
			{preview}
		</Box>
	);
};

export const DiffChangeRow: FC<DiffChangeRowProps> = memo(
	({ change, onJumpToPath }) => {
		const isModifiedBothStrings =
			change.type === "modified" &&
			typeof change.before === "string" &&
			typeof change.after === "string";

		const isModifiedPrimitiveOrSmall =
			change.type === "modified" &&
			(change.before === null ||
				typeof change.before !== "object" ||
				Array.isArray(change.before));

		return (
			<Box
				sx={{
					border: "1px solid",
					borderColor: "divider",
					borderRadius: 1,
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						px: 1,
						py: 0.5,
						backgroundColor:
							change.type === "added"
								? "rgba(46,125,50,0.06)"
								: "rgba(237,108,2,0.06)",
						borderBottom: "1px solid",
						borderColor: "divider",
						display: "flex",
						alignItems: "center",
						gap: 1,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							fontFamily: "monospace",
							color: "text.secondary",
							wordBreak: "break-all",
							flex: 1,
							minWidth: 0,
						}}
					>
						{formatDiffPathForDisplay(change.path)}
					</Typography>
					{onJumpToPath && change.path && (
						<Button
							size="small"
							variant="contained"
							color="warning"
							onClick={() => onJumpToPath(change.path)}
							sx={{
								textTransform: "none",
								fontSize: "0.75rem",
								minWidth: "auto",
								px: 0.5,
							}}
						>
							К JSON
						</Button>
					)}
				</Box>

				<Box sx={{ p: 1 }}>
					{change.type === "added" && (
						<Box sx={{ display: "flex", gap: 0.5, alignItems: "flex-start" }}>
							<Typography
								variant="caption"
								sx={{
									color: "success.main",
									fontWeight: 700,
									minWidth: 40,
									pt: 0.3,
								}}
							>
								NEW
							</Typography>
							<ValueBlock value={change.after} color="green" />
						</Box>
					)}

					{change.type === "modified" && isModifiedBothStrings && (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
							<Typography variant="caption" sx={{ color: "text.secondary" }}>
								Изменения:
							</Typography>
							<InlineStringDiff
								before={change.before as string}
								after={change.after as string}
							/>
						</Box>
					)}

					{change.type === "modified" &&
						!isModifiedBothStrings &&
						isModifiedPrimitiveOrSmall && (
							<Box sx={{ display: "flex", gap: 0.5, alignItems: "flex-start" }}>
								<ValueBlock value={change.before} color="red" />
								<Typography
									variant="caption"
									sx={{
										color: "text.secondary",
										minWidth: 16,
										textAlign: "center",
										pt: 0.5,
									}}
								>
									→
								</Typography>
								<ValueBlock value={change.after} color="green" />
							</Box>
						)}

					{change.type === "modified" &&
						!isModifiedBothStrings &&
						!isModifiedPrimitiveOrSmall && (
							<Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
								<Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
									<Typography
										variant="caption"
										sx={{ color: "error.dark", fontWeight: 600, minWidth: 48 }}
									>
										Было:
									</Typography>
									<ValueBlock value={change.before} color="red" />
								</Box>
								<Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
									<Typography
										variant="caption"
										sx={{
											color: "success.dark",
											fontWeight: 600,
											minWidth: 48,
										}}
									>
										Стало:
									</Typography>
									<ValueBlock value={change.after} color="green" />
								</Box>
							</Box>
						)}
				</Box>
			</Box>
		);
	},
);

DiffChangeRow.displayName = "DiffChangeRow";
