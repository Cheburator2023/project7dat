import { Paper as MUIPaper, type PaperProps, Typography } from "@mui/material";
import { Spacer } from "@react-client/common/primitives/Spacer";

export const Card = (
	props: PaperProps & {
		maxHeight?: string;
		height?: string;
		padding?: string;
		width?: string;
		header?: any;
	},
) => {
	return (
		<MUIPaper
			sx={{
				padding: props.padding || "20px",
				maxHeight: props.maxHeight || "500px",
				height: props.height || "auto",
				overflow: "auto",
				width: props.width,
				...props.sx,
			}}
			variant="outlined"
			{...props}
		>
			{props.header && (
				<>
					<Typography variant="h6">{props.header}</Typography>
					<Spacer space={10} />
				</>
			)}
			{props.children}
		</MUIPaper>
	);
};
