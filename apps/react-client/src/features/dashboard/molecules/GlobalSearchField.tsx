import { memo, useRef, useCallback, useState, useEffect } from "react";
import { Box, TextField, InputAdornment, IconButton } from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import { useDashboardStore } from "../stores";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 3;

export const GlobalSearchField = memo(() => {
	const searchInputRef = useRef<HTMLInputElement>(null);
	const { globalSearchQuery, setGlobalSearch, refe } = useDashboardStore();
	const [localValue, setLocalValue] = useState(globalSearchQuery);

	// Sync local value with store when store changes externally
	useEffect(() => {
		setLocalValue(globalSearchQuery);
	}, [globalSearchQuery]);

	// Debounced search with minimum length
	useEffect(() => {
		const timer = setTimeout(() => {
			if (localValue.length === 0 || localValue.length >= MIN_SEARCH_LENGTH) {
				setGlobalSearch(localValue);
			}
		}, SEARCH_DEBOUNCE_MS);

		return () => clearTimeout(timer);
	}, [localValue, setGlobalSearch]);

	const handleClear = useCallback(() => {
		setLocalValue("");
		setGlobalSearch("");
	}, [setGlobalSearch]);

	return (
		<Box sx={{ position: "relative" }}>
			<TextField
				inputRef={searchInputRef}
				placeholder="Глобальный поиск"
				value={localValue}
				onChange={(e) => setLocalValue(e.target.value)}
				size="small"
				sx={{ width: 350 }}
				helperText={
					localValue.length > 0 && localValue.length < MIN_SEARCH_LENGTH
						? `Введите ещё ${MIN_SEARCH_LENGTH - localValue.length} симв.`
						: undefined
				}
				slotProps={{
					formHelperText: {
						sx: {
							position: "absolute",
							top: "8px",
							right: "34px",
							margin: 0,
						},
					},
					input: {
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" />
							</InputAdornment>
						),
						endAdornment: localValue && (
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
