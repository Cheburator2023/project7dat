import { useCallback, useState } from "react";
import { IconButton } from "@mui/material";
import {
	Fullscreen as FullscreenIcon,
	FullscreenExit as FullscreenExitIcon,
} from "@mui/icons-material";
import { IDockviewHeaderActionsProps } from "@react-client/features/dockview/core";

export const DockviewGroupMaximizeActions = (
	props: IDockviewHeaderActionsProps,
) => {
	const { group } = props;
	const [isMaximized, setIsMaximized] = useState(() => group.api.isMaximized());

	const onToggleMaximize = useCallback(() => {
		const next = !group.api.isMaximized();
		if (next) {
			group.api.maximize();
		} else {
			group.api.exitMaximized();
		}
		setIsMaximized(next);
	}, [group]);

	return (
		<IconButton
			size="small"
			onClick={onToggleMaximize}
			title={isMaximized ? "Восстановить" : "Развернуть"}
		>
			{isMaximized ? (
				<FullscreenExitIcon fontSize="inherit" />
			) : (
				<FullscreenIcon fontSize="inherit" />
			)}
		</IconButton>
	);
};
