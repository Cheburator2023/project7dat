import CloseIcon from "@mui/icons-material/Close";
import {
	IconButton,
	Paper,
	type PaperProps,
	Typography,
	styled,
} from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useState } from "react";

const headerH = 30;

export const Card = (
	props: PaperProps & {
		maxHeight?: string;
		height?: string;
		padding?: string;
		width?: string;
		header?: any;
		onClose?: any;
	},
) => {
	const [visible, setVisible] = useState(true);

	const handler = () => {
		props.onClose();
	};

	return (
		<MUIPaperStyled
			sx={{
				padding: props.padding || "20px",
				maxHeight: props.maxHeight || "100%",
				height: props.height || "auto",
				width: props.width,
				display: visible ? "block" : "none",
				...props.sx,
			}}
			variant="outlined"
			{...props}
		>
			{(props.header || props.onClose) && (
				<>
					<Flex
						justifyContent="space-between"
						alignItems="center"
						width="100%"
						as="header"
						style={{ height: `${headerH}px` }}
					>
						{props.header && (
							<>
								<Typography variant="h6">{props.header}</Typography>
							</>
						)}
						{props.onClose && (
							<IconButton onClick={handler}>
								<CloseIcon />
							</IconButton>
						)}
					</Flex>
					<Spacer space={16} />
				</>
			)}
			<div
				style={{
					height: props.header ? `calc(100% - ${headerH + 15}px)` : "inherit",
					width: "inherit",
				}}
			>
				{props.children}
			</div>
		</MUIPaperStyled>
	);
};

const MUIPaperStyled = styled(Paper)`
 & > div {
	overflow: auto;
 }
`;
