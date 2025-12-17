import { memo } from "react";
import { Alert } from "@mui/material";

interface ErrorAlertProps {
	message: string;
}

export const ErrorAlert = memo(({ message }: ErrorAlertProps) => (
	<Alert severity="error" sx={{ m: 2 }}>
		Ошибка загрузки: {message}
	</Alert>
));

ErrorAlert.displayName = "ErrorAlert";
