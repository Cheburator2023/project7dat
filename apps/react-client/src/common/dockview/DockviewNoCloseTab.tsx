import { IDockviewPanelHeaderProps } from "@react-client/features/dockview/core";
import { DockviewDefaultTab } from "@react-client/features/dockview/src";
import { useCallback, type MouseEvent } from "react";

export const DockviewNoCloseTab = (props: IDockviewPanelHeaderProps) => {
	const onMouseDownCapture = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			if (event.button === 1) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
		[],
	);

	return (
		<div onMouseDownCapture={onMouseDownCapture}>
			<DockviewDefaultTab {...props} hideClose />
		</div>
	);
};
