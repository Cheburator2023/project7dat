import { memo, useCallback } from "react";
import { Box, IconButton, Typography, Select, MenuItem } from "@mui/material";
import {
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
	FirstPage as FirstPageIcon,
	LastPage as LastPageIcon,
} from "@mui/icons-material";

export interface PaginationToolbarProps {
	page: number;
	totalPages: number;
	totalItems: number;
	pageSize: number;
	pageSizeOptions?: number[];
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	isFetching?: boolean;
	itemLabel?: string;
	extraInfo?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export const PaginationToolbar = memo(
	({
		page,
		totalPages,
		totalItems,
		pageSize,
		pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
		onPageChange,
		onPageSizeChange,
		isFetching = false,
		itemLabel = "записей",
		extraInfo,
	}: PaginationToolbarProps) => {
		const handleFirstPage = useCallback(() => onPageChange(1), [onPageChange]);
		const handlePrevPage = useCallback(
			() => onPageChange(Math.max(1, page - 1)),
			[onPageChange, page],
		);
		const handleNextPage = useCallback(
			() => onPageChange(Math.min(totalPages, page + 1)),
			[onPageChange, page, totalPages],
		);
		const handleLastPage = useCallback(
			() => onPageChange(totalPages),
			[onPageChange, totalPages],
		);

		return (
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					px: 1,
					py: 0.25,
					borderTop: "1px solid",
					borderColor: "divider",
					minHeight: 32,
					opacity: isFetching ? 0.6 : 1,
					transition: "opacity 0.15s",
				}}
			>
				<Typography variant="caption" color="text.secondary">
					{totalItems} {itemLabel}
					{extraInfo ? ` ${extraInfo}` : ""}
				</Typography>

				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Select
						size="small"
						value={pageSize}
						onChange={(e) => onPageSizeChange(Number(e.target.value))}
						variant="standard"
						sx={{ fontSize: "12px", minWidth: 50 }}
					>
						{pageSizeOptions.map((size) => (
							<MenuItem key={size} value={size}>
								{size}
							</MenuItem>
						))}
					</Select>

					<IconButton
						size="small"
						onClick={handleFirstPage}
						disabled={page <= 1}
					>
						<FirstPageIcon fontSize="small" />
					</IconButton>
					<IconButton
						size="small"
						onClick={handlePrevPage}
						disabled={page <= 1}
					>
						<ChevronLeftIcon fontSize="small" />
					</IconButton>

					<Typography variant="caption" sx={{ mx: 0.5 }}>
						{page} / {totalPages}
					</Typography>

					<IconButton
						size="small"
						onClick={handleNextPage}
						disabled={page >= totalPages}
					>
						<ChevronRightIcon fontSize="small" />
					</IconButton>
					<IconButton
						size="small"
						onClick={handleLastPage}
						disabled={page >= totalPages}
					>
						<LastPageIcon fontSize="small" />
					</IconButton>
				</Box>
			</Box>
		);
	},
);

PaginationToolbar.displayName = "PaginationToolbar";
