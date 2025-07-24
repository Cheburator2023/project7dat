import { Button, Popover } from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useState } from "react";

export const popoverBtnClass = "popover-btn";

interface PopoverBtnProps {
	title?: string;
	icon: React.ReactNode;
	content: React.ReactNode;
	className?: string;
	contentClassName?: string;
	asChild?: boolean;
	notOnSideNav?: boolean;
}

export function PopoverButton({
	icon,
	title,
	notOnSideNav,
	className,
	contentClassName,
	asChild,
	content,
}: PopoverBtnProps) {
	const _setSideNavExpanded = useStatusStore(
		(state) => state.setSideNavExpanded,
	);

	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);
	const id = open ? "simple-popover" : undefined;

	return (
		<>
			<Button aria-describedby={id} variant="outlined" onClick={handleClick}>
				<Flex justifyContent="center" alignItems="center">
					{!!icon && (
						<>
							<div>{icon}</div>
						</>
					)}

					{!!title && (
						<>
							<Spacer />
							<div>{title}</div>
						</>
					)}
				</Flex>
			</Button>
			<Popover
				id={id}
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "left",
				}}
			>
				<Flex pad="20px">{content}</Flex>
			</Popover>
		</>
	);
}
