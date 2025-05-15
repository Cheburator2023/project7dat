import { type CustomNodeProps, toPathString } from "json-edit-react";
import type { CustomNodeDefinition } from "json-edit-react";

import type React from "react";

export const BooleanToggleComponent: React.FC<CustomNodeProps> = (props) => {
	const { nodeData, value, handleEdit, canEdit } = props;
	console.log("🐸 Pepe said >> props:", props);

	const { path } = nodeData;
	return (
		<div>
			ass
			<input
				className="jer-input-boolean"
				type="checkbox"
				disabled={!canEdit}
				name={toPathString(path)}
				checked={value as boolean}
				onChange={() => {
					// In this case we submit the data value immediately, not just the local
					// state
					handleEdit(!nodeData.value);
					// setValue(!value)
				}}
			/>
		</div>
	);
};

export const BooleanToggleDefinition: CustomNodeDefinition<{
	linkStyles?: React.CSSProperties;
	stringTruncate?: number;
}> = {
	condition: ({ value }) => typeof value === "boolean",
	element: BooleanToggleComponent,
	showOnView: true,
	showOnEdit: false,
	showEditTools: true,
};
