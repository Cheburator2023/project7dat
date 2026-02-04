/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: forEach with early returns */
import { memo, useCallback, useMemo, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns/esm";
import { AgGridReact } from "ag-grid-react";
import type {
	ColDef,
	RowClickedEvent,
	RowDoubleClickedEvent,
	CellContextMenuEvent,
} from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

import { useDashboardStore } from "../stores";
import { useCurrentSchema } from "../hooks/useCurrentSchema";
import { TypeChip } from "../atoms";
import { HIGHLIGHT_COLORS } from "../constants";
import { EntityContextMenu, type EntityContextMenuState } from "../molecules";
import type { EntityRow, EntityConnection } from "../types";
import { strictSearchEntities } from "../utils";

ModuleRegistry.registerModules([AllCommunityModule]);

export const EntitiesPanel = memo(() => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const navigate = useNavigate();

	const {
		selectedEntityId,
		upstreamEntities,
		downstreamEntities,
		globalSearchQuery,
		selectEntity,
		filters,
		setSearchMatchedEntities,
	} = useDashboardStore();

	// Use currentSchema hook to get data synced with editor
	const { currentSchema, effectiveGraphId, isLoading, error } =
		useCurrentSchema();
	console.log("🐸 Pepe said >> currentSchema:", currentSchema);

	// Transform data to entity rows
	const entities: EntityRow[] = useMemo(() => {
		if (!currentSchema) return [];

		const rows: EntityRow[] = [];
		const upstreamMap = new Map<string, Set<string>>();
		const downstreamMap = new Map<string, Set<string>>();

		// Build connection maps from mappings
		const mappings = currentSchema.mappings ?? [];
		mappings.forEach((mapping: DataLineageMapping) => {
			if (!mapping.entityId || !mapping.deps) return;
			mapping.deps.forEach((dep) => {
				if (!dep.entityId) return;
				// target has source as upstream
				if (!upstreamMap.has(mapping.entityId)) {
					upstreamMap.set(mapping.entityId, new Set());
				}
				upstreamMap.get(mapping.entityId)!.add(dep.entityId);
				// source has target as downstream
				if (!downstreamMap.has(dep.entityId)) {
					downstreamMap.set(dep.entityId, new Set());
				}
				downstreamMap.get(dep.entityId)!.add(mapping.entityId);
			});
		});

		// Create rows from entities
		const localEntities = currentSchema.entities ?? [];
		localEntities.forEach((entity: DataLineageEntity) => {
			const upCount = upstreamMap.get(entity.id)?.size ?? 0;
			const downCount = downstreamMap.get(entity.id)?.size ?? 0;

			rows.push({
				id: entity.id,
				graphId: effectiveGraphId || "",
				system_code: entity.system_code,
				name: entity.name ?? entity.id,
				type: entity.type,
				namespace: entity.namespace ?? "",
				description: entity.description ?? "",
				entity_change: entity.entity_change ?? "",
				attributeCount: entity.attrSeq?.length ?? 0,
				upstreamCount: upCount,
				downstreamCount: downCount,
				isDataMart: upCount > 0 && downCount === 0,
				isSource: upCount === 0 && downCount > 0,
				modified: entity.modified ?? false,
			});
		});

		return rows;
	}, [currentSchema, effectiveGraphId]);

	// Strict search entities (full substring match)
	const fuzzyResults = useMemo(() => {
		return strictSearchEntities(entities, globalSearchQuery);
	}, [entities, globalSearchQuery]);

	// Create a map of entity id to highlights for rendering
	const highlightsMap = useMemo(() => {
		const map = new Map<string, Map<string, string>>();
		for (const result of fuzzyResults) {
			if (result.highlights.size > 0) {
				map.set(result.item.id, result.highlights);
			}
		}
		return map;
	}, [fuzzyResults]);

	// Update search matched entities in store for graph highlighting
	useEffect(() => {
		if (globalSearchQuery) {
			const matchedEntities = new Map<string, number>();
			for (const result of fuzzyResults) {
				if (result.score > -10000) {
					matchedEntities.set(result.item.id, result.score);
				}
			}
			setSearchMatchedEntities(matchedEntities);
		} else {
			setSearchMatchedEntities(new Map());
		}
	}, [fuzzyResults, globalSearchQuery, setSearchMatchedEntities]);

	// Filter entities based on search and advanced filters
	const filteredEntities = useMemo(() => {
		// Get items from fuzzy results (already sorted by score)
		let result = fuzzyResults.map((r) => r.item);

		// Entity type filter
		if (filters.entityTypes.length > 0) {
			result = result.filter((e) => filters.entityTypes.includes(e.type));
		}

		// Namespace filter
		if (filters.namespaces.length > 0) {
			result = result.filter((e) => filters.namespaces.includes(e.namespace));
		}

		// Modified only filter
		if (filters.modifiedOnly) {
			result = result.filter((e) => e.modified);
		}

		// Has upstream filter
		if (filters.hasUpstream !== "any") {
			result = result.filter((e) =>
				filters.hasUpstream === "yes"
					? e.upstreamCount > 0
					: e.upstreamCount === 0,
			);
		}

		// Has downstream filter
		if (filters.hasDownstream !== "any") {
			result = result.filter((e) =>
				filters.hasDownstream === "yes"
					? e.downstreamCount > 0
					: e.downstreamCount === 0,
			);
		}

		// Attribute count filter
		if (filters.attrCountMin || filters.attrCountMax) {
			const min = filters.attrCountMin
				? Number.parseInt(filters.attrCountMin, 10)
				: 0;
			const max = filters.attrCountMax
				? Number.parseInt(filters.attrCountMax, 10)
				: Number.POSITIVE_INFINITY;
			result = result.filter(
				(e) => e.attributeCount >= min && e.attributeCount <= max,
			);
		}

		return result;
	}, [fuzzyResults, filters]);

	// Navigate to entity page
	const handleNavigateToEntity = useCallback(
		(data: EntityRow) => {
			const encodedId = encodeURIComponent(data.id);
			navigate(`/entity/${encodedId}`);
		},
		[navigate],
	);

	// Column definitions
	const columnDefs: ColDef<EntityRow>[] = useMemo(
		() => [
			// {
			// 	field: "originalId",
			// 	headerName: "ID",
			// 	flex: 1,
			// 	cellRenderer: ({ value, data }: { value: string; data: EntityRow }) => {
			// 		const highlights = highlightsMap.get(data.id);
			// 		const highlightedNs = highlights?.get("originalId");
			// 		if (highlightedNs) {
			// 			return (
			// 				<span
			// 					dangerouslySetInnerHTML={{ __html: highlightedNs }}
			// 					style={{ display: "block" }}
			// 				/>
			// 			);
			// 		}
			// 		return data.id;
			// 	},
			// },
			{
				field: "namespace",
				headerName: "База данных",
				flex: 1,
				cellRenderer: ({ value, data }: { value: string; data: EntityRow }) => {
					const highlights = highlightsMap.get(data.id);
					const highlightedNs = highlights?.get("namespace");
					if (highlightedNs) {
						return (
							<span
								dangerouslySetInnerHTML={{ __html: highlightedNs }}
								style={{ display: "block" }}
							/>
						);
					}
					return value;
				},
			},
			{
				field: "system_code",
				headerName: "Система",
				width: 120,
				cellRenderer: ({ value }: { value?: string }) => value || "—",
			},
			{
				field: "name",
				headerName: "Наименование",
				flex: 2,
				minWidth: 180,
				cellRenderer: ({ value, data }: { value: string; data: EntityRow }) => {
					const highlights = highlightsMap.get(data.id);
					const highlightedName = highlights?.get("name");
					if (highlightedName) {
						return (
							<span
								dangerouslySetInnerHTML={{ __html: highlightedName }}
								style={{ display: "block" }}
							/>
						);
					}
					return value;
				},
			},

			// {
			// 	field: "isDataMart",
			// 	headerName: "Метки",
			// 	width: 90,
			// 	cellRenderer: ({ data }: { data: EntityRow }) => (
			// 		<EntityBadges
			// 			isDataMart={data.isDataMart}
			// 			isSource={data.isSource}
			// 			modified={data.modified}
			// 		/>
			// 	),
			// },
			{
				field: "type",
				headerName: "Тип",
				width: 100,
				cellRenderer: ({ value }: { value: string }) => (
					<TypeChip type={value} />
				),
			},
			//
			// {
			// 	field: "attributeCount",
			// 	headerName: "Атр.",
			// 	width: 70,
			// 	cellRenderer: ({ value }: { value: number }) => (
			// 		<Chip
			// 			sx={{
			// 				fontSize: "11px",
			// 			}}
			// 			label={value}
			// 			size="small"
			// 			variant="outlined"
			// 		/>
			// 	),
			// },
			// {
			// 	field: "upstreamCount",
			// 	headerName: "Upstream",
			// 	width: 60,
			// 	cellRenderer: ({ value }: { value: number }) => (
			// 		<ConnectionCount count={value} direction="upstream" />
			// 	),
			// },
			// {
			// 	field: "downstreamCount",
			// 	headerName: "Downstream",
			// 	width: 60,
			// 	cellRenderer: ({ value }: { value: number }) => (
			// 		<ConnectionCount count={value} direction="downstream" />
			// 	),
			// },
			{
				field: "description",
				headerName: "Описание",
				flex: 1,
				cellRenderer: ({ value, data }: { value: string; data: EntityRow }) => {
					const highlights = highlightsMap.get(data.id);
					const highlightedNs = highlights?.get("description");
					if (highlightedNs) {
						return (
							<span
								dangerouslySetInnerHTML={{ __html: highlightedNs }}
								style={{ display: "block" }}
							/>
						);
					}
					return value;
				},
			},
			{
				field: "entity_change",
				headerName: "Изменено",
				flex: 1,
				cellRenderer: ({ value }: { value: string }) => {
					// const highlights = highlightsMap.get(data.id);
					// const highlightedNs = highlights?.get("entity_change");
					// if (highlightedNs) {
					// 	return (
					// 		<span
					// 			dangerouslySetInnerHTML={{ __html: highlightedNs }}
					// 			style={{ display: "block" }}
					// 		/>
					// 	);
					// }
					if (!value) return "";
					try {
						return format(parseISO(value), "dd.MM.yyyy, HH:mm");
					} catch {
						return value;
					}
				},
			},
		],
		[highlightsMap],
	);

	const handleRowClicked = useCallback(
		(event: RowClickedEvent<EntityRow>) => {
			if (event.data) {
				selectEntity(event.data.id, event.data.graphId);
			}
		},
		[selectEntity],
	);

	const handleRowDoubleClicked = useCallback(
		(event: RowDoubleClickedEvent<EntityRow>) => {
			if (event.data) {
				handleNavigateToEntity(event.data);
			}
		},
		[handleNavigateToEntity],
	);

	// Context menu state
	const [contextMenu, setContextMenu] = useState<EntityContextMenuState | null>(
		null,
	);

	const handleCellContextMenu = useCallback(
		(event: CellContextMenuEvent<EntityRow>) => {
			event.event?.preventDefault();
			if (event.data) {
				const mouseEvent = event.event as MouseEvent;
				setContextMenu({
					entityId: event.data.id,
					entityName: event.data.name,
					entityType: event.data.type,
					x: mouseEvent.clientX,
					y: mouseEvent.clientY,
				});
			}
		},
		[],
	);

	const handleCloseContextMenu = useCallback(() => {
		setContextMenu(null);
	}, []);

	// Get entity for context menu
	const contextMenuEntity = useMemo(() => {
		if (!contextMenu || !currentSchema) return null;
		return (
			currentSchema.entities?.find((e) => e.id === contextMenu.entityId) || null
		);
	}, [contextMenu, currentSchema]);

	// Build connections for context menu
	const entityConnections: EntityConnection[] = useMemo(() => {
		if (!currentSchema) return [];
		const connections: EntityConnection[] = [];
		const entityMap = new Map<string, { name: string; id: string }>();
		for (const e of currentSchema.entities || []) {
			entityMap.set(e.id, { name: e.name || e.id, id: e.id });
		}

		for (const mapping of currentSchema.mappings || []) {
			if (!mapping.deps) continue;
			for (const dep of mapping.deps) {
				const sourceEntity = entityMap.get(dep.entityId);
				const targetEntity = entityMap.get(mapping.entityId);
				if (!sourceEntity || !targetEntity) continue;

				connections.push({
					id: `${dep.entityId}->${mapping.entityId}`,
					sourceId: dep.entityId,
					targetId: mapping.entityId,
					sourceName: sourceEntity.name,
					targetName: targetEntity.name,
					attrMaps: dep.attrMaps || [],
					description: "",
				});
			}
		}
		return connections;
	}, [currentSchema]);

	const getRowStyle = useCallback(
		(params: { data?: EntityRow }) => {
			const entityId = params.data?.id;
			if (!entityId) return undefined;

			if (entityId === selectedEntityId) {
				return { backgroundColor: `${HIGHLIGHT_COLORS.selected}40` };
			}
			if (upstreamEntities.has(entityId)) {
				return { backgroundColor: `${HIGHLIGHT_COLORS.upstream}20` };
			}
			if (downstreamEntities.has(entityId)) {
				return { backgroundColor: `${HIGHLIGHT_COLORS.downstream}20` };
			}
			return undefined;
		},
		[selectedEntityId, upstreamEntities, downstreamEntities],
	);

	return (
		<Box sx={{ height: "100%", width: "100%", minHeight: 0 }}>
			<AgGridReact
				rowData={filteredEntities}
				columnDefs={columnDefs}
				theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
				onRowClicked={handleRowClicked}
				onRowDoubleClicked={handleRowDoubleClicked}
				onCellContextMenu={handleCellContextMenu}
				preventDefaultOnContextMenu
				getRowStyle={getRowStyle}
				rowSelection="single"
				suppressCellFocus
				animateRows
				rowHeight={28}
				headerHeight={32}
				loading={isLoading}
				overlayNoRowsTemplate="Нет данных"
			/>

			<EntityContextMenu
				contextMenu={contextMenu}
				onClose={handleCloseContextMenu}
				entity={contextMenuEntity}
				connections={entityConnections}
			/>
		</Box>
	);
});

EntitiesPanel.displayName = "EntitiesPanel";
