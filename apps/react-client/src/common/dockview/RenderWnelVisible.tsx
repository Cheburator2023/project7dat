import * as React from "react";
import type { ComponentType, FunctionComponent } from "react";
import type { IDockviewPanelProps } from "@react-client/features/dockview/core";

export function RenderWhenVisible(
	Component: ComponentType<IDockviewPanelProps>,
): FunctionComponent<IDockviewPanelProps> {
	const HigherOrderComponent: FunctionComponent<IDockviewPanelProps> = (
		props,
	) => {
		const [visible, setVisible] = React.useState<boolean>(props.api.isVisible);

		React.useEffect(() => {
			const disposable = props.api.onDidVisibilityChange((event) => {
				setVisible(event.isVisible);
			});

			return () => {
				disposable.dispose();
			};
		}, [props.api]);

		if (!visible) {
			return null;
		}

		return <Component {...props} />;
	};

	return HigherOrderComponent;
}
