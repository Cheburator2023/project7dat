import { Paper as MUIPaper, type PaperProps } from "@mui/material";

export const Card = (props: PaperProps & { maxHeight?: string }) => {
	return (
		<MUIPaper
			sx={{
				padding: "20px",
				maxHeight: props.maxHeight || "500px",
				height: "auto",
				overflow: "auto",
				...props.sx,
			}}
			variant="outlined"
			{...props}
		>
			{props.children}
		</MUIPaper>
	);
};
