import React, { memo, useState, useCallback, useEffect } from "react";
import {
	Box,
	TextField,
	Popover,
	Paper,
	Typography,
	Button,
	styled,
	useTheme,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

export interface DateRange {
	from: Date | null;
	to: Date | null;
}

interface DateRangePickerProps {
	value: DateRange;
	onChange: (range: DateRange) => void;
	placeholder?: string;
	size?: "small" | "medium";
	fullWidth?: boolean;
	disabled?: boolean;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
	padding: theme.spacing(2),
	minWidth: 320,
	boxShadow: theme.shadows[8],
}));

const DatePickerContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
}));

const ButtonContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "flex-end",
	gap: theme.spacing(1),
	marginTop: theme.spacing(1),
}));

export const DateRangePicker: React.FC<DateRangePickerProps> = memo(
	({
		value,
		onChange,
		placeholder = "Выберите период дата/время",
		size = "small",
		fullWidth = false,
		disabled = false,
	}) => {
		const _theme = useTheme();
		const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
		const [tempRange, setTempRange] = useState<DateRange>(value);

		const open = Boolean(anchorEl);

		useEffect(() => {
			setTempRange(value);
		}, [value]);

		const handleClick = useCallback(
			(event: React.MouseEvent<HTMLElement>) => {
				if (!disabled) {
					setAnchorEl(event.currentTarget);
					setTempRange({ ...value });
				}
			},
			[disabled, value],
		);

		const handleClose = useCallback(() => {
			setAnchorEl(null);
		}, []);

		const isValidRange =
			!tempRange.from || !tempRange.to || tempRange.from <= tempRange.to;

		const handleApply = useCallback(() => {
			if (isValidRange) {
				onChange(tempRange);
				handleClose();
			}
		}, [tempRange, onChange, handleClose, isValidRange]);

		const handleClear = useCallback(() => {
			const clearedRange = { from: null, to: null };
			setTempRange(clearedRange);
			onChange(clearedRange);
			handleClose();
		}, [onChange, handleClose]);

		const formatDateRange = useCallback((range: DateRange): string => {
			if (!range.from && !range.to) return "";

			const formatDateTime = (date: Date | null) =>
				date
					? date.toLocaleString("ru-RU", {
							year: "numeric",
							month: "2-digit",
							day: "2-digit",
							hour: "2-digit",
							minute: "2-digit",
						})
					: "";

			if (range.from && range.to) {
				return `${formatDateTime(range.from)} - ${formatDateTime(range.to)}`;
			}

			if (range.from) {
				return `от ${formatDateTime(range.from)}`;
			}

			if (range.to) {
				return `до ${formatDateTime(range.to)}`;
			}

			return "";
		}, []);

		const displayValue = formatDateRange(value);

		return (
			<>
				<TextField
					value={displayValue}
					placeholder={placeholder}
					onClick={handleClick}
					size={size}
					fullWidth={fullWidth}
					disabled={disabled}
					variant="outlined"
					InputProps={{
						readOnly: true,
						sx: {
							cursor: disabled ? "default" : "pointer",
							"& input": {
								cursor: disabled ? "default" : "pointer",
							},
						},
					}}
				/>

				<Popover
					open={open}
					anchorEl={anchorEl}
					onClose={handleClose}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "left",
					}}
					transformOrigin={{
						vertical: "top",
						horizontal: "left",
					}}
				>
					<StyledPaper>
						<Typography variant="subtitle2" gutterBottom>
							Выберите период дата/время
						</Typography>

						<DatePickerContainer>
							<DateTimePicker
								label="Дата и время от"
								value={tempRange.from}
								onChange={(newValue) => {
									setTempRange((prev) => ({
										...prev,
										from: newValue,
										to:
											newValue && prev.to && newValue > prev.to
												? null
												: prev.to,
									}));
								}}
								slotProps={{
									textField: {
										size: "small",
										fullWidth: true,
									},
								}}
							/>

							<DateTimePicker
								label="Дата и время до"
								value={tempRange.to}
								onChange={(newValue) => {
									setTempRange((prev) => ({
										...prev,
										to: newValue,
										from:
											newValue && prev.from && newValue < prev.from
												? null
												: prev.from,
									}));
								}}
								slotProps={{
									textField: {
										size: "small",
										fullWidth: true,
									},
								}}
							/>
						</DatePickerContainer>

						{!isValidRange && tempRange.from && tempRange.to && (
							<Typography
								variant="caption"
								color="error"
								sx={{ mt: 1, display: "block" }}
							>
								Дата начала должна быть раньше даты окончания
							</Typography>
						)}

						<ButtonContainer>
							<Button variant="text" size="small" onClick={handleClear}>
								Очистить
							</Button>
							<Button
								variant="contained"
								size="small"
								onClick={handleApply}
								disabled={!isValidRange}
							>
								Применить
							</Button>
						</ButtonContainer>
					</StyledPaper>
				</Popover>
			</>
		);
	},
);
