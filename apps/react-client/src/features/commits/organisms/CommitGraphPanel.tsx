import { memo, useMemo, useState, useCallback } from "react";
import { Box } from "@mui/material";
import { ReactFlowProvider } from "@xyflow/react";
import type { DataLineageMapping } from "@react-client/types/dataLineage";
import { MappingDetailsDialog } from "@react-client/features/entityPreview/components/MappingDetailsDialog";
import { EntityDetailsDialog } from "@react-client/features/entityPreview/components/EntityDetailsDialog";
import type { DataLineageEntity } from "@react-client/types/dataLineage";
import {
	GraphPanelInner,
	type NodeContextMenuEvent,
} from "@react-client/features/entities/organisms/GraphPanelInner";
import type { EntityConnection } from "@react-client/features/entities/types";
import {
	useCommitMergeStore,
	extractCommitEntities,
	extractCommitMappings,
} from "../stores/commitMergeStore";

export const CommitGraphPanel = memo(() => {
	const { commit, selectedEntityId, setSelectedEntityId } =
		useCommitMergeStore();

	const entities = useMemo(() => extractCommitEntities(commit), [commit]);
	const mappings = useMemo(() => extractCommitMappings(commit), [commit]);

	const [depthLimit, setDepthLimit] = useState(1);
	const [dialogEntity, setDialogEntity] = useState<DataLineageEntity | null>(
		null,
	);
	const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
	const [selectedConnection, setSelectedConnection] =
		useState<EntityConnection | null>(null);
	const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);

	const schemaForGraph = useMemo(() => {
		const normalizedMappings: DataLineageMapping[] = mappings.map(
			(m, i) =>
				({
					...m,
					id: m.id ?? m.entity_map_id ?? i,
				}) as unknown as DataLineageMapping,
		);
		return {
			entities,
			mappings: normalizedMappings,
			desc: undefined,
		};
	}, [entities, mappings]);

	const entityConnections = useMemo(() => {
		const connections: EntityConnection[] = [];
		const entityMap = new Map<string, { id: string; name?: string | null }>();
		for (const e of entities) {
			entityMap.set(e.id, e);
		}
		for (const mapping of mappings) {
			if (!mapping.deps) continue;
			for (const dep of mapping.deps) {
				const sourceEntity = entityMap.get(dep.entityId);
				const targetEntity = entityMap.get(mapping.entityId);
				if (!sourceEntity || !targetEntity) continue;
				const mappingId =
					mapping.id ??
					mapping.entity_map_id ??
					`${mapping.entityId}_${dep.entityId}`;
				connections.push({
					id: `${dep.entityId}->${mapping.entityId}::${mappingId}`,
					sourceId: dep.entityId,
					targetId: mapping.entityId,
					sourceName: sourceEntity.name || sourceEntity.id,
					targetName: targetEntity.name || targetEntity.id,
					processName: dep.process || "Процесс не указан",
					processId: dep.process_id,
					processCode: mapping.system_code || dep.system_code,
					attrMaps: dep.attrMaps || [],
					description: "",
				});
			}
		}
		return connections;
	}, [entities, mappings]);

	const handleSelectEntity = useCallback(
		(id: string | null) => setSelectedEntityId(id),
		[setSelectedEntityId],
	);

	const handleNodeDoubleClick = useCallback(
		(entityId: string, _graphId: string) => {
			const entity = entities.find((e) => e.id === entityId);
			if (entity) {
				setDialogEntity(entity as unknown as DataLineageEntity);
				setIsEntityDialogOpen(true);
			}
		},
		[entities],
	);

	const handleEdgeClick = useCallback(
		(sourceId: string, targetId: string) => {
			const connection = entityConnections.find(
				(c) => c.sourceId === sourceId && c.targetId === targetId,
			);
			if (connection) {
				setSelectedConnection(connection);
				setIsMappingDialogOpen(true);
			}
		},
		[entityConnections],
	);

	const handleNodeContextMenu = useCallback(
		(_event: NodeContextMenuEvent) => {},
		[],
	);

	if (entities.length === 0) {
		return (
			<Box
				sx={{
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "text.secondary",
				}}
			>
				Нет данных для графа
			</Box>
		);
	}

	return (
		<Box sx={{ height: "100%", width: "100%", position: "relative" }}>
			<ReactFlowProvider>
				<GraphPanelInner
					data={schemaForGraph as any}
					graphId="commit-preview"
					selectedEntityId={selectedEntityId}
					onSelectEntity={handleSelectEntity}
					onNodeDoubleClick={handleNodeDoubleClick}
					onOpenEntity={() => {}}
					onViewDetails={(entityId: string) => {
						const entity = entities.find((e) => e.id === entityId);
						if (entity) {
							setDialogEntity(entity as unknown as DataLineageEntity);
							setIsEntityDialogOpen(true);
						}
					}}
					onUpstreamDownstreamChange={() => {}}
					onEdgeClick={handleEdgeClick}
					onNodeContextMenu={handleNodeContextMenu}
					depthLimit={depthLimit}
					onDepthChange={setDepthLimit}
				/>
			</ReactFlowProvider>

			{dialogEntity && (
				<EntityDetailsDialog
					open={isEntityDialogOpen}
					onClose={() => {
						setIsEntityDialogOpen(false);
						setDialogEntity(null);
					}}
					entity={dialogEntity}
					connections={entityConnections.filter(
						(c) =>
							c.sourceId === dialogEntity.id || c.targetId === dialogEntity.id,
					)}
					onOpenEntity={() => {}}
					onOpenConnection={(conn) => {
						setSelectedConnection(conn);
						setIsMappingDialogOpen(true);
					}}
				/>
			)}

			{selectedConnection && (
				<MappingDetailsDialog
					open={isMappingDialogOpen}
					onClose={() => {
						setIsMappingDialogOpen(false);
						setSelectedConnection(null);
					}}
					connection={selectedConnection}
				/>
			)}
		</Box>
	);
});

CommitGraphPanel.displayName = "CommitGraphPanel";
