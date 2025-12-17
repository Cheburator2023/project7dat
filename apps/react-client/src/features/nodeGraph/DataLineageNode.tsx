import { Box, Chip, Paper, Typography, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import type { DataLineageNode } from "@react-client/types/dataLineage";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import { useShallow } from "zustand/react/shallow";
import "./DataLineageNode.css";

const getNodeColor = (type: DataLineageNode["type"]) => {
	switch (type) {
		case "source":
			return "#4CAF50";
		case "destination":
			return "#2196F3";
		case "view":
			return "#FF9800";
		case "transformation":
			return "#9C27B0";
		case "dataset":
			return "#F44336";
		case "model":
			return "#3F51B5";
		default:
			return "#607D8B";
	}
};

export const DataLineageNodeComponent = memo(
	({ id, data, selected }: NodeProps<any>) => {
		const { selectNode } = useDataLineageStore(
			useShallow((state) => ({
				selectNode: state.selectNode,
			})),
		);

		const node = data.node;
		const nodeColor = getNodeColor(node.type);
		const visibleTags = node.metadata.tags.slice(0, 2);
		const extraTagsCount = Math.max(0, node.metadata.tags.length - 2);
		const hasChildren = data.hasChildren || false;
		const isExpanded = data.isExpanded || false;

		const handleClick = () => {
			selectNode(id);
		};

		return (
			<Paper
				className={`data-lineage-node ${selected ? "data-lineage-node--selected" : "data-lineage-node--unselected"}`}
				style={{
					width: data.width,
					minHeight: data.height,
				}}
				onClick={handleClick}
			>
				<Box
					className="data-lineage-node__header"
					style={{
						backgroundColor: nodeColor,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "4px 8px",
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: "white", fontWeight: "bold" }}
					>
						{node.type.toUpperCase()}
					</Typography>
					{hasChildren && (
						<IconButton
							size="small"
							title={
								isExpanded
									? "Свернуть связи (Ctrl+Click или двойной клик)"
									: "Развернуть связи (Ctrl+Click или двойной клик)"
							}
							sx={{
								color: "white",
								padding: "2px",
								"&:hover": {
									backgroundColor: "rgba(255, 255, 255, 0.2)",
								},
							}}
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							{isExpanded ? (
								<ExpandLess fontSize="small" />
							) : (
								<ExpandMore fontSize="small" />
							)}
						</IconButton>
					)}
				</Box>
				<Box className="data-lineage-node__content">
					<Typography variant="subtitle2" className="data-lineage-node__title">
						{node.name}
					</Typography>
					<Chip
						label={node.type}
						size="small"
						className="data-lineage-node__type-chip"
						style={{ backgroundColor: nodeColor }}
					/>
					{node.description && (
						<Typography
							variant="caption"
							className="data-lineage-node__description"
						>
							{node.description}
						</Typography>
					)}
					{visibleTags.length > 0 && (
						<Box className="data-lineage-node__tags">
							{visibleTags.map((tag: any) => (
								<Chip
									key={tag}
									label={tag}
									size="small"
									variant="outlined"
									className="data-lineage-node__tag"
								/>
							))}
							{extraTagsCount > 0 && (
								<Chip
									label={`+${extraTagsCount}`}
									size="small"
									variant="outlined"
									className="data-lineage-node__tag"
								/>
							)}
						</Box>
					)}
				</Box>

				<Handle
					type="target"
					position={Position.Left}
					className="data-lineage-node__handle"
				/>
				<Handle
					type="source"
					position={Position.Right}
					className="data-lineage-node__handle"
				/>
			</Paper>
		);
	},
);

DataLineageNodeComponent.displayName = "DataLineageNodeComponent";

export const ObjectNode = DataLineageNodeComponent;
export const RootNode = DataLineageNodeComponent;
export const VirtualTargetNode = DataLineageNodeComponent;
