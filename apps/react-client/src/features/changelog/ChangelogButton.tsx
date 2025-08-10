import { Button } from "@mui/material";
import { History as HistoryIcon } from "@mui/icons-material";
import { useNavigate } from "react-router";

interface ChangelogButtonProps {
	graphId?: string;
	variant?: "button" | "icon";
	size?: "small" | "medium" | "large";
	fullWidth?: boolean;
}

export const ChangelogButton = ({
	graphId,
	variant = "button",
	size = "medium",
	fullWidth = false,
}: ChangelogButtonProps) => {
	const navigate = useNavigate();

	const handleClick = () => {
		if (graphId) {
			navigate(`/changelog/${graphId}`);
		} else {
			navigate("/changelog");
		}
	};

	const _title = graphId
		? "История изменений графика"
		: "Общая история изменений";

	if (variant === "icon") {
		return (
			<Button onClick={handleClick} size={size} variant="contained" fullWidth>
				Показать
			</Button>
		);
	}

	return (
		<Button
			variant="outlined"
			startIcon={<HistoryIcon />}
			onClick={handleClick}
			size={size}
			fullWidth={fullWidth}
		>
			{graphId ? "История" : "Общая история"}
		</Button>
	);
};
