import React, { useMemo, useState } from "react";
import { styled, Box, Typography, Button, ButtonGroup } from "@mui/material";
import {
	ReactFlow,
	ReactFlowProvider,
	Background,
	Controls,
} from "@xyflow/react";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";
import { DataLineageNodeComponent } from "../../nodeGraph/DataLineageNode";
import type { DataLineageNode } from "@react-client/types/dataLineage";
import { getLayoutedElements } from "../utils/dagreLayout";

interface EntityNodeViewProps {
	entity: DataLineageEntity | null;
	mappings: DataLineageMapping[];
	onEntitiesCalculated?: (entities: DataLineageEntity[]) => void;
}

export const EntityNodeView: React.FC<EntityNodeViewProps> = ({
	entity,
	mappings,
	onEntitiesCalculated,
}) => {
	const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB");

	if (!entity) {
		return (
			<Container>
				<Typography variant="body1" color="text.secondary">
					Сущность не выбрана
				</Typography>
			</Container>
		);
	}

	const { flowNodes, flowEdges, allEntities } = useMemo(() => {
		// Find all related entities through mappings
		const relatedEntityIds = new Set<string>();
		const entityMap = new Map<string, DataLineageEntity>();

		// Add the main entity
		entityMap.set(entity.id, entity);

		// Find mappings where this entity is involved
		const relevantMappings = mappings.filter(
			(mapping) =>
				mapping.entityId === entity.id ||
				mapping.deps?.some((dep) => dep.entityId === entity.id),
		);

		// Collect all related entity IDs
		relevantMappings.forEach((mapping) => {
			relatedEntityIds.add(mapping.entityId);
			mapping.deps?.forEach((dep) => {
				relatedEntityIds.add(dep.entityId);
			});
		});

		// For now, we'll create placeholder entities for IDs we don't have full data for
		// In a real scenario, you'd fetch these from your data source
		const allEntitiesArray = Array.from(relatedEntityIds).map((id) => {
			if (id === entity.id) return entity;

			// Create placeholder entity - in real app you'd fetch this data
			return {
				id,
				name: id.split(".").pop() || id,
				type: "table" as const,
				modified: false,
				namespace: id.includes(".")
					? id.split(".").slice(0, -1).join(".")
					: undefined,
				attrSeq: [],
			};
		});

		// Create nodes with initial positioning (will be overridden by Dagre)
		const initialNodes = allEntitiesArray.map((ent) => {
			const isMainEntity = ent.id === entity.id;

			const node: DataLineageNode = {
				id: ent.id,
				name: ent.name,
				type: ent.type === "table" ? "dataset" : "view",
				description: `${ent.namespace ? `${ent.namespace}.` : ""}${ent.name}`,
				metadata: {
					created: new Date().toISOString(),
					updated: new Date().toISOString(),
					tags: ent.attrSeq?.map((attr) => `${attr.name}: ${attr.type}`) || [],
				},
				position: { x: 0, y: 0 }, // Initial position, will be set by Dagre
				status: ent.modified ? "active" : "inactive",
			};

			return {
				id: ent.id,
				type: "dataLineageNode",
				position: { x: 0, y: 0 }, // Initial position, will be set by Dagre
				data: {
					node,
					selected: isMainEntity,
					width: 220,
					height: 120,
				},
				draggable: true,
				selectable: true,
				focusable: true,
			};
		});

		// Create edges based on mappings
		const initialEdges = relevantMappings.flatMap(
			(mapping) =>
				mapping.deps?.map((dep) => ({
					id: `${dep.entityId}-${mapping.entityId}`,
					source: dep.entityId,
					target: mapping.entityId,
					type: "default",
					style: {
						stroke: "#666",
						strokeWidth: 2,
					},
					animated: true,
					label: dep.attrMaps?.length
						? `${dep.attrMaps.length} атрибутов`
						: undefined,
				})) || [],
		);

		// Apply Dagre layout
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			initialNodes,
			initialEdges,
			layoutDirection,
		);

		return {
			flowNodes: layoutedNodes,
			flowEdges: layoutedEdges,
			allEntities: allEntitiesArray,
		};
	}, [entity, mappings, layoutDirection]);

	// Call the callback with calculated entities
	React.useEffect(() => {
		if (onEntitiesCalculated) {
			onEntitiesCalculated(allEntities);
		}
	}, [allEntities, onEntitiesCalculated]);

	return (
		<Container>
			<ControlsHeader>
				<Typography variant="h6" component="h2">
					Граф зависимостей
				</Typography>
				<ButtonGroup size="small" variant="outlined">
					<Button
						onClick={() => setLayoutDirection("TB")}
						variant={layoutDirection === "TB" ? "contained" : "outlined"}
					>
						Сверху вниз
					</Button>
					<Button
						onClick={() => setLayoutDirection("LR")}
						variant={layoutDirection === "LR" ? "contained" : "outlined"}
					>
						Слева направо
					</Button>
				</ButtonGroup>
			</ControlsHeader>
			<NodeVisualization>
				<ReactFlowProvider>
					<ReactFlow
						nodes={flowNodes}
						edges={flowEdges}
						nodeTypes={nodeTypes}
						fitView
						fitViewOptions={{ padding: 0.1 }}
						zoomOnScroll={true}
					>
						<Background />
						<Controls />
					</ReactFlow>
				</ReactFlowProvider>
			</NodeVisualization>
		</Container>
	);
};

const Container = styled(Box)(({ theme }) => ({
	height: "100%",
	display: "flex",
	flexDirection: "column",
	padding: theme.spacing(2),
}));

const ControlsHeader = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	marginBottom: theme.spacing(2),
}));

const NodeVisualization = styled(Box)(({ theme }) => ({
	height: "100%",
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius,
	overflow: "hidden",
}));

const nodeTypes = {
	dataLineageNode: DataLineageNodeComponent as any,
};
