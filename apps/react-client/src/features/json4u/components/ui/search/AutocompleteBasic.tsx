import { type InputBaseComponentProps, Tooltip } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField, {
	type TextFieldPropsColorOverrides,
} from "@mui/material/TextField";
import { useTheme } from "@mui/material/styles";
import type { OverridableStringUnion } from "@mui/types";
import React from "react";
import { useEffect } from "react";

export const AutocompleteBasic: React.FC<{
	placeholder?: string;
	options?: any[];
	defaultValue?: any;
	onChange?: any;
	returnedId?: string;
	returnedName?: string;
	required?: boolean;
	label?: string;
	error?: boolean;
	helperText?: string;
	disabled?: boolean;
	defaultValueId?: string;
	variant?: "filled" | "outlined" | "standard" | undefined;
	color?: OverridableStringUnion<
		"primary" | "secondary" | "error" | "info" | "success" | "warning",
		TextFieldPropsColorOverrides
	>;
	size?: "small" | "medium";
	disableClearable?: boolean;
	inputProps?: InputBaseComponentProps;
}> = ({
	defaultValue = null,
	placeholder = "",
	returnedId = "id",
	returnedName = "name",
	options = [],
	onChange,
	required,
	label,
	error,
	helperText,
	disabled,
	defaultValueId,
	variant,
	color,
	size = "medium",
	disableClearable = false,
	inputProps,
}) => {
	const theme = useTheme();

	const [value, setValue] = React.useState(defaultValue);
	const handleChange = (
		event: any,
		value: {
			[x: string]: string;
		},
	) => {
		setValue(value);
		onChange?.(value);
	};

	useEffect(() => {
		if (defaultValueId && options) {
			setValue(options?.find((item) => item?.[returnedId] === defaultValueId));
		}
	}, [defaultValueId, options]);

	return defaultValue || options.length ? (
		<Autocomplete
			disableClearable={disableClearable}
			noOptionsText="Нет совпадений"
			loadingText="Нет совпадений"
			disabled={disabled}
			loading={!defaultValue}
			value={value}
			onChange={handleChange}
			options={options}
			getOptionLabel={(option) => (option ? option?.[returnedName] : "")}
			isOptionEqualToValue={(option, value) =>
				option?.[returnedId] === value?.[returnedId]
			}
			renderOption={(props, option) => {
				return (
					<li {...props} key={option?.[returnedId]}>
						{option?.icon}
						{option?.[returnedName]}
					</li>
				);
			}}
			renderInput={(params) => (
				<TextField
					{...params}
					size={size}
					variant={variant || "filled"}
					color={color || "secondary"}
					placeholder={placeholder}
					required={required}
					label={label}
					error={error}
					helperText={helperText}
					inputProps={{ ...params.inputProps, ...inputProps }}
					sx={{
						"& .MuiInputBase-root": {
							paddingLeft: 0,
							paddingRight: "0!important",
							"&::before": {
								width: disableClearable ? "10%" : "30%",
							},
						},
						"& .MuiInputLabel-root": {
							display: "flex",
							flexDirection: "row-reverse",
							gap: "6px",
						},
						"& .MuiFormLabel-asterisk.MuiInputLabel-asterisk": {
							color: "red",
						},
						"& .MuiInputBase-root input.MuiAutocomplete-input.MuiInputBase-input":
							{
								padding: `${label ? "19.5px" : "5.5px"} 0 5.5px 12px!important`,
								width: "auto",
							},
					}}
				/>
			)}
		/>
	) : (
		<Tooltip
			title={
				required ? "В обязательном поле отсутствуют варианты для выбора" : ""
			}
		>
			<TextField
				fullWidth
				disabled
				label={"Список пуст"}
				variant={variant || "filled"}
				size="small"
				error={error}
				helperText={helperText}
			/>
		</Tooltip>
	);
};
