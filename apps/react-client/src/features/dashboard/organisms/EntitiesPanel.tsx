/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: forEach with early returns */
import { memo, useCallback, useMemo } from "react";
import { Box, Typography, Chip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import type {
	ColDef,
	RowClickedEvent,
	RowDoubleClickedEvent,
} from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import type {
	DataLineageEntity,
	DataLineageMapping,
} from "@react-client/types/dataLineage";

import { useDashboardStore } from "../stores";
import { useCurrentSchema } from "../hooks/useCurrentSchema";
import {
	LoadingSpinner,
	ErrorAlert,
	TypeChip,
	EntityBadges,
	ConnectionCount,
} from "../atoms";
import { HIGHLIGHT_COLORS } from "../constants";
import type { EntityRow } from "../types";

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
	} = useDashboardStore();

	// Use currentSchema hook to get data synced with editor
	const { currentSchema, effectiveGraphId, isLoading, error } =
		useCurrentSchema();

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
				name: entity.name ?? entity.id,
				type: entity.type,
				namespace: entity.namespace ?? "",
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

	// Filter entities based on search and advanced filters
	const filteredEntities = useMemo(() => {
		let result = entities;

		// Text search filter
		if (globalSearchQuery) {
			const q = globalSearchQuery.toLowerCase();
			result = result.filter(
				(e) =>
					e.name.toLowerCase().includes(q) ||
					e.namespace.toLowerCase().includes(q) ||
					e.type.toLowerCase().includes(q),
			);
		}

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
	}, [entities, globalSearchQuery, filters]);

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
			{
				field: "name",
				headerName: "Сущность",
				flex: 2,
				width: 180,
				cellRenderer: ({ value }: { value: string }) => (
					<Typography variant="body2" fontWeight={500}>
						{value}
					</Typography>
				),
			},
			{
				field: "isDataMart",
				headerName: "Метки",
				width: 90,
				cellRenderer: ({ data }: { data: EntityRow }) => (
					<EntityBadges
						isDataMart={data.isDataMart}
						isSource={data.isSource}
						modified={data.modified}
					/>
				),
			},
			{
				field: "type",
				headerName: "Тип",
				width: 100,
				cellRenderer: ({ value }: { value: string }) => (
					<TypeChip type={value} />
				),
			},
			{
				field: "namespace",
				headerName: "Namespace",
				flex: 1,
			},
			{
				field: "attributeCount",
				headerName: "Атр.",
				width: 70,
				cellRenderer: ({ value }: { value: number }) => (
					<Chip label={value} size="small" variant="outlined" />
				),
			},
			{
				field: "upstreamCount",
				headerName: "↑",
				width: 60,
				cellRenderer: ({ value }: { value: number }) => (
					<ConnectionCount count={value} direction="upstream" />
				),
			},
			{
				field: "downstreamCount",
				headerName: "↓",
				width: 60,
				cellRenderer: ({ value }: { value: number }) => (
					<ConnectionCount count={value} direction="downstream" />
				),
			},
		],
		[],
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

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (error) {
		return <ErrorAlert message={error.message} />;
	}

	return (
		<Box sx={{ height: "100%", width: "100%" }}>
			<AgGridReact
				rowData={filteredEntities}
				columnDefs={columnDefs}
				theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
				onRowClicked={handleRowClicked}
				onRowDoubleClicked={handleRowDoubleClicked}
				getRowStyle={getRowStyle}
				rowSelection="single"
				suppressCellFocus
				animateRows
				rowHeight={28}
				headerHeight={32}
			/>
		</Box>
	);
});

EntitiesPanel.displayName = "EntitiesPanel";
