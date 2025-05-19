import { Paper as MUIPaper, type PaperProps } from "@mui/material";

export const Card = (
	props: PaperProps & { maxHeight?: string; height?: string; padding?: string },
) => {
	return (
		<MUIPaper
			sx={{
				padding: props.padding || "20px",
				maxHeight: props.maxHeight || "500px",
				height: props.height || "auto",
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
