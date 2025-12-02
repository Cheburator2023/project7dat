import { memo, useRef, useCallback } from "react";
import { Box, TextField, InputAdornment, IconButton } from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import { useDashboardStore } from "../stores";

export const GlobalSearchField = memo(() => {
	const searchInputRef = useRef<HTMLInputElement>(null);
	const { globalSearchQuery, setGlobalSearch } = useDashboardStore();

	const handleClear = useCallback(() => {
		setGlobalSearch("");
	}, [setGlobalSearch]);

	return (
		<Box sx={{ position: "relative" }}>
			<TextField
				inputRef={searchInputRef}
				placeholder="Глобальный поиск..."
				value={globalSearchQuery}
				onChange={(e) => setGlobalSearch(e.target.value)}
				size="small"
				sx={{ width: 350 }}
				slotProps={{
					input: {
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" />
							</InputAdornment>
						),
						endAdornment: globalSearchQuery && (
							<InputAdornment position="end">
								<IconButton size="small" onClick={handleClear}>
									<CloseIcon fontSize="small" />
								</IconButton>
							</InputAdornment>
						),
					},
				}}
			/>
		</Box>
	);
});

GlobalSearchField.displayName = "GlobalSearchField";
