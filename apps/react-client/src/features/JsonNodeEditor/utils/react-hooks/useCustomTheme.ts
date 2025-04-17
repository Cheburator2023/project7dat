import { useColorScheme } from "@mui/material";

type UseThemeReturn = ReturnType<typeof useColorScheme>;

type UseCustomThemeReturn = UseThemeReturn & {
	theme: "light" | "dark";
	isDarkMode: boolean;
};

export const useCustomTheme = (): UseCustomThemeReturn => {
	const useThemeReturn = useColorScheme();

	const isDarkMode = useThemeReturn.mode === "dark";

	return {
		...useThemeReturn,
		theme: isDarkMode ? "dark" : "light",
		isDarkMode,
	};
};
