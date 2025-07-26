import { Box, Chip, Paper, Typography } from "@mui/material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import type { DataLineageNode } from "@react-client/types/dataLineage";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { NodeWithData } from "./useVirtualGraph";

export const DataLineageNodeComponent = memo(
	({ id, data, selected }: NodeProps<NodeWithData>) => {
		const { selectNode } = useDataLineageStore(
			useShallow((state) => ({
				selectNode: state.selectNode,
			})),
		);

		const node = data.node;

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

		const handleClick = () => {
			selectNode(id);
		};

		return (
			<Paper
				elevation={selected ? 8 : 2}
				sx={{
					width: data.width,
					minHeight: data.height,
					border: selected ? "2px solid #1976d2" : "1px solid #e0e0e0",
					cursor: "pointer",
					transition: "all 0.2s ease-in-out",
					"&:hover": {
						elevation: 4,
						transform: "scale(1.02)",
					},
				}}
				onClick={handleClick}
			>
				<Box
					sx={{
						height: 8,
						backgroundColor: getNodeColor(node.type),
						borderRadius: "8px 8px 0 0",
					}}
				/>
				<Box sx={{ p: 2 }}>
					<Typography
						variant="subtitle2"
						sx={{
							fontWeight: 600,
							mb: 1,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{node.name}
					</Typography>
					<Chip
						label={node.type}
						size="small"
						sx={{
							backgroundColor: getNodeColor(node.type),
							color: "white !important",
							fontSize: "0.7rem",
							height: 20,
							mb: 1,
						}}
					/>
					{node.description && (
						<Typography
							variant="caption"
							sx={{
								display: "-webkit-box",
								WebkitLineClamp: 2,
								WebkitBoxOrient: "vertical",
								overflow: "hidden",
								color: "text.secondary",
								lineHeight: 1.2,
							}}
						>
							{node.description}
						</Typography>
					)}
					{node.metadata.tags.length > 0 && (
						<Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
							{node.metadata.tags.slice(0, 2).map((tag) => (
								<Chip
									key={tag}
									label={tag}
									size="small"
									variant="outlined"
									sx={{ fontSize: "0.6rem", height: 16 }}
								/>
							))}
							{node.metadata.tags.length > 2 && (
								<Chip
									label={`+${node.metadata.tags.length - 2}`}
									size="small"
									variant="outlined"
									sx={{ fontSize: "0.6rem", height: 16 }}
								/>
							)}
						</Box>
					)}
				</Box>

				<Handle
					type="target"
					position={Position.Left}
					style={{
						background: "#555",
						width: 8,
						height: 8,
					}}
				/>
				<Handle
					type="source"
					position={Position.Right}
					style={{
						background: "#555",
						width: 8,
						height: 8,
					}}
				/>
			</Paper>
		);
	},
);

DataLineageNodeComponent.displayName = "DataLineageNodeComponent";

export const ObjectNode = DataLineageNodeComponent;
export const RootNode = DataLineageNodeComponent;
export const VirtualTargetNode = DataLineageNodeComponent;
