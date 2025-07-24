import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

interface TargetHandleProps {
	childrenNum?: number;
}

export const TargetHandle = memo(({ childrenNum = 0 }: TargetHandleProps) => {
	return (
		<Handle
			type="target"
			isConnectable
			position={Position.Left}
			style={{ top: "50%" }}
		/>
	);
});
TargetHandle.displayName = "TargetHandle";

interface SourceHandleProps {
	id: string;
	indexInParent?: number;
	isChildrenHidden?: boolean;
}

export const SourceHandle = memo(
	({ id, indexInParent, isChildrenHidden }: SourceHandleProps) => {
		const backgroundColor = isChildrenHidden ? "rgb(156 163 175)" : undefined;
		return (
			<Handle
				type="source"
				isConnectable
				id={id}
				position={Position.Right}
				style={{ top: "50%", backgroundColor }}
			/>
		);
	},
);
SourceHandle.displayName = "SourceHandle";
