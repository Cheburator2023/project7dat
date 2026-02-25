import CloseIcon from "@mui/icons-material/Close";
import {
	Button,
	ButtonGroup,
	CircularProgress,
	IconButton,
	Paper,
	type PaperProps,
	Typography,
	styled,
} from "@mui/material";

import { Flex } from "@react-client/common/primitives/Flex";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { usePageLocalStorage } from "@react-client/common/hooks/usePageLocalStorage";
import { useState } from "react";

const headerH = 20;

const CardWithZoom = (props: CardWithZoomProps) => {
	const {
		maxHeight,
		overflow = "auto",
		loading = false,
		header,
		onClose,
		padding,
		height,
		width,
		nonClickable,
		zoom,
		uuid,
		...paperProps
	} = props;
	const [visible, _setVisible] = useState(true);
	const {
		data: __zoom,
		setValue: setZoom,
		clearValue,
	} = usePageLocalStorage<string>(
		`ls_card_${props.uuid}`,
		(props.zoom || 1).toString(),
	);

	const _zoom = Number.parseFloat(__zoom || "1");

	const handler = () => {
		onClose();
	};

	const zoomHandler = (fract: number) => {
		setZoom((_zoom + fract).toString());
	};

	return (
		<MUIPaperStyled
			overflow={overflow}
			sx={{
				padding: padding || "10px",
				maxHeight: maxHeight || "100%",
				height: height || "auto",
				width: width,
				display: visible ? "block" : "none",
				...props.sx,
			}}
			variant="outlined"
			{...paperProps}
		>
			{loading && (
				<LoadingOverlay>
					<CircularProgress size={40} />
				</LoadingOverlay>
			)}
			{(header || onClose) && (
				<Flex
					justifyContent="space-between"
					alignItems="center"
					width="100%"
					as="header"
					style={{ height: `${headerH}px` }}
				>
					{header && (
						<Typography variant="body1">
							<b>{header}</b>
						</Typography>
					)}
					{props.showZoomControl && (
						<ButtonGroup variant="text" size="small">
							<Button
								onClick={() => zoomHandler(-0.1)}
								sx={{
									minWidth: "30px !important",
									height: "26px",
								}}
							>
								<b>-</b>
							</Button>
							<Button
								onClick={() => zoomHandler(0.1)}
								sx={{
									minWidth: "30px !important",
									height: "26px",
								}}
							>
								<b>+</b>
							</Button>
						</ButtonGroup>
					)}
					{onClose && (
						<IconButton onClick={handler} sx={{ padding: 0 }}>
							<CloseIcon />
						</IconButton>
					)}
				</Flex>
			)}
			{!!(header || onClose) && <Spacer space={6} />}
			<Wrapper
				nonClickable={!!nonClickable}
				style={{
					height: header
						? overflow
							? `calc(100% - ${headerH + 45}px)`
							: "inherit"
						: "inherit",
					width: "inherit",
					zoom: _zoom,
				}}
			>
				{props.children}
			</Wrapper>
		</MUIPaperStyled>
	);
};

const Wrapper = styled("div", {
	shouldForwardProp: (prop) => prop !== "nonClickable",
})<{ nonClickable: boolean }>`

	& > * {
		pointer-events: ${({ nonClickable }) => nonClickable && "none"};
	}
	
					`;

const CardWithoutZoom = (props: BaseCardProps) => {
	const {
		maxHeight,
		overflow = "auto",
		header,
		onClose,
		padding,
		height,
		width,
		nonClickable,
		...paperProps
	} = props;
	const [visible, _setVisible] = useState(true);

	const handler = () => {
		onClose();
	};

	return (
		<MUIPaperStyled
			overflow={overflow}
			sx={{
				padding: padding || "10px 7px 10px 11px",
				maxHeight: maxHeight || "100%",
				height: height || "auto",
				width: width,
				display: visible ? "block" : "none",
				...props.sx,
			}}
			variant="outlined"
			{...paperProps}
		>
			{(header || onClose) && (
				<Flex
					justifyContent="space-between"
					alignItems="center"
					width="100%"
					as="header"
					style={{ height: `${headerH}px` }}
				>
					{header && <Typography variant="h6">{header}</Typography>}
					{onClose && (
						<IconButton onClick={handler}>
							<CloseIcon />
						</IconButton>
					)}
				</Flex>
			)}
			{!!(header || onClose) && <Spacer space={6} />}
			<Wrapper
				nonClickable={!!nonClickable}
				style={{
					height: header
						? overflow
							? `calc(100% - ${headerH + 45}px)`
							: "inherit"
						: "inherit",
					width: "inherit",
				}}
			>
				{props.children}
			</Wrapper>
		</MUIPaperStyled>
	);
};

type BaseCardProps = PaperProps & {
	maxHeight?: string;
	height?: string;
	padding?: string;
	width?: string;
	header?: any;
	onClose?: any;
	overflow?: string | null;
	nonClickable?: boolean;
	showZoomControl?: boolean;
};

type CardWithZoomProps = BaseCardProps & {
	zoom: number;
	uuid: string;
	loading?: boolean;
};

type CardWithoutZoomProps = BaseCardProps & {
	zoom?: never;
	uuid?: string;
};

type CardProps = CardWithZoomProps | CardWithoutZoomProps;

export const Card = (props: CardProps) => {
	if (props.zoom !== undefined && props.uuid) {
		return <CardWithZoom {...props} zoom={props.zoom} uuid={props.uuid} />;
	}
	return <CardWithoutZoom {...props} variant="outlined" />;
};

const MUIPaperStyled = styled(Paper, {
	shouldForwardProp: (prop) => prop !== "overflow",
})<{ overflow: string | null }>`
	pointer-events: all;
	position: relative;
	overflow: hidden;
	& > div {
		padding: 0;
		overflow: ${({ overflow }) => overflow};
	}
`;

const LoadingOverlay = styled("div")`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(255, 255, 255, 0.8);
	backdrop-filter: blur(2px);
	z-index: 1000;
	transition: all 0.3s ease-in-out;
	animation: fadeIn 0.3s ease-in-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;
