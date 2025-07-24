import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
	EdgeWithData,
	NodeWithData,
} from "@react-client/features/json4u/lib/graph/types";
import { getParentId } from "@react-client/features/json4u/lib/idgen";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useTreeStore } from "@react-client/features/json4u/stores/treeStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import {
	ArrowLeft,
	CopyMinus,
	CopyPlus,
	SquareMinus,
	SquarePlus,
} from "lucide-react";
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
	const t = useTranslations();
	const { setNodes, setEdges } = useReactFlow<NodeWithData, EdgeWithData>();

	const {
		fold,
		foldSiblings,
		toggleFoldNode,
		toggleFoldSibingsNode,
		setRevealPosition,
	} = useStatusStore(
		useShallow((state) => ({
			setRevealPosition: state.setRevealPosition,
			toggleFoldNode: state.toggleFoldNode,
			toggleFoldSibingsNode: state.toggleFoldSibingsNode,
			fold: !state.unfoldNodeMap[id],
			foldSiblings: !state.unfoldSiblingsNodeMap[id],
		})),
	);

	const parentId = getParentId(id);
	const isRoot = parentId === undefined;
	const tree = useTreeStore((state) => state.main);
	const hasSiblings =
		!isRoot && tree.nonLeafChildrenNodes(tree.node(parentId)).length > 1;
	const hasNonLeafChildren =
		tree.nonLeafChildrenNodes(tree.node(id)).length > 0;

	return (
		<StyledNodeToolbar
			isVisible={true}
			position={Position.Top}
			align="start"
			offset={0}
		>
			{!isRoot && (
				<ToolbarButton
					title={t("go to parent")}
					onClick={async () => {
						if (parentId) {
							const { nodes, edges } =
								await window.worker.toggleGraphNodeSelected(parentId);
							setNodes(nodes);
							setEdges(edges);
							setRevealPosition({
								treeNodeId: parentId,
								type: "node",
								from: "graphAll",
							});
						}
					}}
				>
					<ArrowLeft className="icon" />
				</ToolbarButton>
			)}
			{hasSiblings && (
				<ToolbarButton
					title={t(foldSiblings ? "fold_siblings" : "unfold_siblings")}
					onClick={async () => {
						toggleFoldSibingsNode(id);
						const { nodes, edges } =
							await window.worker.triggerGraphFoldSiblings(id, foldSiblings);
						setNodes(nodes);
						setEdges(edges);
					}}
				>
					{foldSiblings ? (
						<CopyMinus className="icon" />
					) : (
						<CopyPlus className="icon" />
					)}
				</ToolbarButton>
			)}
			{hasNonLeafChildren && (
				<ToolbarButton
					title={t(fold ? "fold node" : "unfold node")}
					onClick={async () => {
						toggleFoldNode(id);
						const { nodes, edges } = await window.worker.toggleGraphNodeHidden(
							id,
							undefined,
							fold,
						);
						setNodes(nodes);
						setEdges(edges);
					}}
				>
					{fold ? (
						<SquareMinus className="icon" />
					) : (
						<SquarePlus className="icon" />
					)}
				</ToolbarButton>
			)}
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
