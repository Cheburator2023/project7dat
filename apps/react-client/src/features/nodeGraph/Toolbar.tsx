import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import type { DataLineageNode } from "@react-client/types/dataLineage";
import { NodeToolbar, Position } from "@xyflow/react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { type ReactNode, memo } from "react";
import { useShallow } from "zustand/react/shallow";

const StyledNodeToolbar = styled(NodeToolbar)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: "fit-content",
	height: "fit-content",
	backgroundColor: theme.palette.action.hover,
}));

const StyledToolbarButton = styled(Button)({
	height: 24,
	width: 24,
	padding: 4,
	minWidth: 24,
});

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
		<StyledNodeToolbar
			isVisible={true}
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
		</StyledNodeToolbar>
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
			<StyledToolbarButton
				title={title}
				onClick={(ev) => {
					ev.preventDefault();
					ev.stopPropagation();
					onClick();
				}}
			>
				{children}
			</StyledToolbarButton>
		);
	},
);
