import { Button } from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import type { DataLineageNode } from "@react-client/types/dataLineage";
import { NodeToolbar, Position } from "@xyflow/react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { type ReactNode, memo } from "react";
import { useShallow } from "zustand/react/shallow";

interface ToolbarProps {
	id: string;
}

export const Toolbar = memo(({ id }: ToolbarProps) => {
	const { currentGraph, deleteNode, updateNode } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
			deleteNode: state.deleteNode,
			updateNode: state.updateNode,
		})),
	);

	const node = currentGraph?.nodes.find((n: DataLineageNode) => n.id === id);
	if (!node) return null;

	const isHidden = node.status === "inactive";

	return (
		<NodeToolbar
			isVisible={true}
			className="flex items-center justify-center w-fit h-fit bg-input"
			position={Position.Top}
			align="start"
			offset={0}
		>
			<ToolbarButton
				title={isHidden ? "Show node" : "Hide node"}
				onClick={() => {
					updateNode(id, {
						...node,
						status: isHidden ? "active" : "inactive",
					});
				}}
			>
				{isHidden ? <Eye className="icon" /> : <EyeOff className="icon" />}
			</ToolbarButton>
			<ToolbarButton
				title="Delete node"
				onClick={() => {
					deleteNode(id);
				}}
			>
				<Trash2 className="icon" />
			</ToolbarButton>
		</NodeToolbar>
	);
});
Toolbar.displayName = "Toolbar";

interface ToolbarButtonProps {
	title: string;
	onClick: () => void;
	children: ReactNode;
}

const ToolbarButton = memo(
	({ title, onClick, children }: ToolbarButtonProps) => {
		return (
			<Button
				className="h-6 w-6 p-1"
				title={title}
				onClick={(ev) => {
					ev.preventDefault();
					ev.stopPropagation();
					onClick();
				}}
			>
				{children}
			</Button>
		);
	},
);
