import Button from "@mui/material/Button";
import { useNavigate } from "react-router";
import { routes } from "routing/routes";

export const Page404 = () => {
	const navigate = useNavigate();
	return (
		<div>
			<p className="text-red-500 font-semibold text-2xl">
				Page Not Found &#128549;
			</p>
			<Button
				color="primary"
				variant="contained"
				onClick={() => navigate(routes.home)}
			>
				Redirect to homepage
			</Button>
		</div>
	);
};
