import { memo, useState, useMemo, useCallback } from "react";
import {
	IconButton,
	Badge,
	Modal,
	Paper,
	Typography,
	Box,
	Chip,
	FormControlLabel,
	Checkbox,
	Select,
	MenuItem,
	TextField,
	Button,
} from "@mui/material";
import { FilterList as FilterListIcon } from "@mui/icons-material";
import { useDashboardStore } from "../stores";
import { TYPE_COLORS } from "../constants";
import type { FilterState } from "../types";

interface FilterButtonProps {
	filterOptions: {
		entityTypes: string[];
		namespaces: string[];
	};
}

export const FilterButton = memo(({ filterOptions }: FilterButtonProps) => {
	const [open, setOpen] = useState(false);
	const { filters, updateFilter, resetFilters } = useDashboardStore();

	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (filters.entityTypes.length) count++;
		if (filters.modifiedOnly) count++;
		if (filters.namespaces.length) count++;
		if (filters.hasUpstream !== "any") count++;
		if (filters.hasDownstream !== "any") count++;
		if (filters.attrCountMin || filters.attrCountMax) count++;
		return count;
	}, [filters]);

	const handleOpen = useCallback(() => setOpen(true), []);
	const handleClose = useCallback(() => setOpen(false), []);

	return (
		<>
			<Badge
				badgeContent={activeFilterCount}
				color="error"
				invisible={activeFilterCount === 0}
			>
				<IconButton
					size="small"
					onClick={handleOpen}
					color={open ? "primary" : "default"}
				>
					<FilterListIcon />
				</IconButton>
			</Badge>

			<Modal open={open} onClose={handleClose}>
				<Paper
					elevation={8}
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						p: 3,
						maxHeight: "90vh",
						overflow: "auto",
						borderRadius: 2,
					}}
				>
					<Typography variant="subtitle2" fontWeight={600} mb={2}>
						Расширенные фильтры
					</Typography>

					{/* Entity Type Filter */}
					<Box mb={2}>
						<Typography variant="caption" color="text.secondary" mb={0.5}>
							Тип сущности
						</Typography>
						<Box display="flex" flexWrap="wrap" gap={0.5}>
							{filterOptions.entityTypes.map((type) => {
								const colors = TYPE_COLORS[type] || TYPE_COLORS.table;
								const isSelected = filters.entityTypes.includes(type);
								return (
									<Chip
										key={type}
										label={type}
										size="small"
										onClick={() => {
											const newTypes = isSelected
												? filters.entityTypes.filter((t) => t !== type)
												: [...filters.entityTypes, type];
											updateFilter("entityTypes", newTypes);
										}}
										sx={{
											bgcolor: isSelected ? colors.bg : "transparent",
											color: isSelected ? colors.text : "text.secondary",
											borderColor: isSelected ? colors.border : "divider",
											border: 1,
											fontWeight: isSelected ? 600 : 400,
											cursor: "pointer",
										}}
									/>
								);
							})}
						</Box>
					</Box>

					{/* Namespace Filter */}
					{filterOptions.namespaces.length > 0 && (
						<Box mb={2}>
							<Typography variant="caption" color="text.secondary" mb={0.5}>
								Схема / Namespace
							</Typography>
							<Box
								display="flex"
								flexWrap="wrap"
								gap={0.5}
								maxHeight={80}
								overflow="auto"
							>
								{filterOptions.namespaces.slice(0, 10).map((ns) => {
									const isSelected = filters.namespaces.includes(ns);
									return (
										<Chip
											key={ns}
											label={ns}
											size="small"
											onClick={() => {
												const newNs = isSelected
													? filters.namespaces.filter((n) => n !== ns)
													: [...filters.namespaces, ns];
												updateFilter("namespaces", newNs);
											}}
											sx={{
												bgcolor: isSelected ? "primary.light" : "transparent",
												color: isSelected
													? "primary.contrastText"
													: "text.secondary",
												border: 1,
												borderColor: isSelected ? "primary.main" : "divider",
												fontWeight: isSelected ? 600 : 400,
												cursor: "pointer",
												maxWidth: 120,
											}}
											title={ns}
										/>
									);
								})}
							</Box>
						</Box>
					)}

					{/* Modified Only */}
					<FormControlLabel
						control={
							<Checkbox
								size="small"
								checked={filters.modifiedOnly}
								onChange={(e) => updateFilter("modifiedOnly", e.target.checked)}
							/>
						}
						label={<Typography variant="body2">Только изменённые</Typography>}
						sx={{ mb: 1 }}
					/>

					{/* Connection Filters */}
					<Box display="flex" gap={1} mb={2}>
						<Box flex={1}>
							<Typography variant="caption" color="text.secondary">
								Источники
							</Typography>
							<Select
								size="small"
								fullWidth
								value={filters.hasUpstream}
								onChange={(e) =>
									updateFilter(
										"hasUpstream",
										e.target.value as FilterState["hasUpstream"],
									)
								}
							>
								<MenuItem value="any">Любые</MenuItem>
								<MenuItem value="yes">Есть</MenuItem>
								<MenuItem value="no">Нет</MenuItem>
							</Select>
						</Box>
						<Box flex={1}>
							<Typography variant="caption" color="text.secondary">
								Потребители
							</Typography>
							<Select
								size="small"
								fullWidth
								value={filters.hasDownstream}
								onChange={(e) =>
									updateFilter(
										"hasDownstream",
										e.target.value as FilterState["hasDownstream"],
									)
								}
							>
								<MenuItem value="any">Любые</MenuItem>
								<MenuItem value="yes">Есть</MenuItem>
								<MenuItem value="no">Нет</MenuItem>
							</Select>
						</Box>
					</Box>

					{/* Attribute Count Filter */}
					<Box mb={2}>
						<Typography variant="caption" color="text.secondary">
							Кол-во атрибутов
						</Typography>
						<Box display="flex" gap={1}>
							<TextField
								size="small"
								type="number"
								placeholder="Мин"
								value={filters.attrCountMin}
								onChange={(e) => updateFilter("attrCountMin", e.target.value)}
								sx={{ flex: 1 }}
							/>
							<TextField
								size="small"
								type="number"
								placeholder="Макс"
								value={filters.attrCountMax}
								onChange={(e) => updateFilter("attrCountMax", e.target.value)}
								sx={{ flex: 1 }}
							/>
						</Box>
					</Box>

					{/* Reset Button */}
					{activeFilterCount > 0 && (
						<Button
							fullWidth
							variant="outlined"
							color="error"
							size="small"
							onClick={resetFilters}
						>
							Сбросить фильтры ({activeFilterCount})
						</Button>
					)}
				</Paper>
			</Modal>
		</>
	);
});

FilterButton.displayName = "FilterButton";
