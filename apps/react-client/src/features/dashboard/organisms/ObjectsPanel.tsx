import { memo, useCallback, useMemo, useState } from "react";
import {
	Box,
	Typography,
	Chip,
	FormControlLabel,
	Checkbox,
} from "@mui/material";
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
import { MappingDetailsDialog } from "@react-client/features/entityPreview";

import { useDashboardStore } from "../stores";
import { useCurrentSchema } from "../hooks/useCurrentSchema";
import { LoadingSpinner, ObjectTypeChip } from "../atoms";
import { HIGHLIGHT_COLORS } from "../constants";
import type { ObjectRow, LinkRow, EntityConnection } from "../types";

export const ObjectsPanel = memo(() => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const navigate = useNavigate();

	const {
		selectedEntityId,
		selectedAttributeName,
		selectAttribute,
		globalSearchQuery,
	} = useDashboardStore();

	// Use currentSchema hook to get data synced with editor
	const { currentSchema, effectiveGraphId, isLoading } = useCurrentSchema();

	// View mode toggle: "attributes" or "links"
	const [viewMode, setViewMode] = useState<"attributes" | "links">(
		"attributes",
	);

	// State for mapping dialog
	const [selectedLink, setSelectedLink] = useState<LinkRow | null>(null);
	const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);

	// Transform data to object rows (attributes)
	const objects: ObjectRow[] = useMemo(() => {
		if (!currentSchema) return [];

		const rows: ObjectRow[] = [];
		const localEntities = currentSchema.entities ?? [];
		localEntities.forEach((entity: DataLineageEntity) => {
			// Add entity row
			rows.push({
				id: `${effectiveGraphId}::${entity.id}`,
				graphId: effectiveGraphId || "",
				name: entity.name ?? entity.id,
				objectType: entity.modified ? "Витрина" : "Источник",
				parentEntity: entity.id,
				description: "",
			});

			// Add attribute rows
			entity.attrSeq?.forEach((attr) => {
				rows.push({
					id: `${effectiveGraphId}::${entity.id}::${attr.name}`,
					graphId: effectiveGraphId || "",
					name: attr.name,
					objectType: "Признак",
					parentEntity: entity.id,
					dataType: attr.type,
					description: attr.comment ?? "",
				});
			});
		});

		return rows;
	}, [currentSchema, effectiveGraphId]);

	// Transform data to link rows (connections)
	const links: LinkRow[] = useMemo(() => {
		if (!currentSchema) return [];

		const rows: LinkRow[] = [];
		const entityMap = new Map<string, DataLineageEntity>();
		for (const entity of currentSchema.entities || []) {
			entityMap.set(entity.id, entity);
		}

		(currentSchema.mappings || []).forEach((mapping: DataLineageMapping) => {
			if (!mapping.deps) return;
			mapping.deps.forEach((dep) => {
				const sourceEntity = entityMap.get(dep.entityId);
				const targetEntity = entityMap.get(mapping.entityId);
				if (!sourceEntity || !targetEntity) return;

				const attrMaps = dep.attrMaps || [];
				rows.push({
					id: `${effectiveGraphId}::${dep.entityId}->${mapping.entityId}`,
					graphId: effectiveGraphId || "",
					sourceEntity: dep.entityId,
					sourceName: sourceEntity.name || sourceEntity.id,
					targetEntity: mapping.entityId,
					targetName: targetEntity.name || targetEntity.id,
					attrMappingsCount: attrMaps.length,
					attrMaps,
				});
			});
		});

		return rows;
	}, [currentSchema, effectiveGraphId]);

	// Filter by selected entity and search
	const filteredObjects = useMemo(() => {
		let filtered = objects;

		// Filter by selected entity
		if (selectedEntityId) {
			filtered = filtered.filter((o) => o.parentEntity === selectedEntityId);
		}

		// Filter by search
		if (globalSearchQuery) {
			const q = globalSearchQuery.toLowerCase();
			filtered = filtered.filter(
				(o) =>
					o.name.toLowerCase().includes(q) ||
					o.description.toLowerCase().includes(q) ||
					(o.dataType && o.dataType.toLowerCase().includes(q)),
			);
		}

		return filtered;
	}, [objects, selectedEntityId, globalSearchQuery]);

	// Filter links by selected entity and search
	const filteredLinks = useMemo(() => {
		let filtered = links;

		// Filter by selected entity (show links where entity is source or target)
		if (selectedEntityId) {
			filtered = filtered.filter(
				(l) =>
					l.sourceEntity === selectedEntityId ||
					l.targetEntity === selectedEntityId,
			);
		}

		// Filter by search
		if (globalSearchQuery) {
			const q = globalSearchQuery.toLowerCase();
			filtered = filtered.filter(
				(l) =>
					l.sourceName.toLowerCase().includes(q) ||
					l.targetName.toLowerCase().includes(q),
			);
		}

		return filtered;
	}, [links, selectedEntityId, globalSearchQuery]);

	// Navigate to object page
	const handleNavigateToObject = useCallback(
		(data: ObjectRow) => {
			const objectId = encodeURIComponent(data.id);
			navigate(`/objects/${objectId}`);
		},
		[navigate],
	);

	// Handle link click to open mapping dialog
	const handleLinkClick = useCallback((link: LinkRow) => {
		setSelectedLink(link);
		setIsMappingDialogOpen(true);
	}, []);

	// Column definitions for attributes
	const attributeColumnDefs: ColDef<ObjectRow>[] = useMemo(
		() => [
			{
				field: "name",
				headerName: "Объект",
				flex: 2,
			},
			{
				field: "objectType",
				headerName: "Тип",
				width: 100,
				cellRenderer: ({ value }: { value: ObjectRow["objectType"] }) => (
					<ObjectTypeChip type={value} />
				),
			},
			{
				field: "dataType",
				headerName: "Тип данных",
				width: 120,
				cellRenderer: ({ value }: { value?: string }) =>
					value ? <Chip label={value} size="small" variant="outlined" /> : null,
			},
			{
				field: "description",
				headerName: "Описание",
				flex: 1,
			},
		],
		[],
	);

	// Column definitions for links
	const linkColumnDefs: ColDef<LinkRow>[] = useMemo(
		() => [
			{
				field: "sourceName",
				headerName: "Источник",
				flex: 1,
				cellRenderer: ({ value }: { value: string }) => (
					<Typography variant="body2" fontWeight={500}>
						{value}
					</Typography>
				),
			},
			{
				headerName: "",
				width: 50,
				cellRenderer: () => (
					<Typography color="text.secondary" sx={{ textAlign: "center" }}>
						→
					</Typography>
				),
				sortable: false,
				filter: false,
			},
			{
				field: "targetName",
				headerName: "Цель",
				flex: 1,
				cellRenderer: ({ value }: { value: string }) => (
					<Typography variant="body2" fontWeight={500}>
						{value}
					</Typography>
				),
			},
			{
				field: "attrMappingsCount",
				headerName: "Маппинги",
				width: 100,
				cellRenderer: ({ value }: { value: number }) => (
					<Chip
						label={value}
						size="small"
						color={value > 0 ? "primary" : "default"}
						variant="outlined"
					/>
				),
			},
		],
		[],
	);

	const handleRowClicked = useCallback(
		(event: RowClickedEvent<ObjectRow>) => {
			if (event.data?.objectType === "Признак") {
				selectAttribute(event.data.name);
			}
		},
		[selectAttribute],
	);

	const handleRowDoubleClicked = useCallback(
		(event: RowDoubleClickedEvent<ObjectRow>) => {
			if (event.data) {
				handleNavigateToObject(event.data);
			}
		},
		[handleNavigateToObject],
	);

	const handleLinkRowClicked = useCallback(
		(event: RowClickedEvent<LinkRow>) => {
			if (event.data) {
				handleLinkClick(event.data);
			}
		},
		[handleLinkClick],
	);

	const getRowStyle = useCallback(
		(params: { data?: ObjectRow }) => {
			if (params.data?.name === selectedAttributeName) {
				return { backgroundColor: `${HIGHLIGHT_COLORS.selected}40` };
			}
			return undefined;
		},
		[selectedAttributeName],
	);

	if (isLoading) {
		return <LoadingSpinner />;
	}

	// Convert LinkRow to EntityConnection for MappingDetailsDialog
	const selectedConnection: EntityConnection | null = selectedLink
		? {
				id: selectedLink.id,
				sourceId: selectedLink.sourceEntity,
				targetId: selectedLink.targetEntity,
				sourceName: selectedLink.sourceName,
				targetName: selectedLink.targetName,
				attrMaps: selectedLink.attrMaps,
			}
		: null;

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Header with toggle and info */}
			<Box
				sx={{
					p: 1,
					bgcolor: "action.hover",
					borderBottom: 1,
					borderColor: "divider",
					display: "flex",
					alignItems: "center",
					gap: 2,
				}}
			>
				<FormControlLabel
					control={
						<Checkbox
							size="small"
							checked={viewMode === "links"}
							onChange={(e) =>
								setViewMode(e.target.checked ? "links" : "attributes")
							}
						/>
					}
					label={
						<Typography variant="caption">
							{viewMode === "links" ? "Связи" : "Атрибуты"}
						</Typography>
					}
					sx={{ m: 0 }}
				/>
				{selectedEntityId && (
					<Typography variant="caption" color="text.secondary">
						Фильтр: <strong>{selectedEntityId}</strong>
					</Typography>
				)}
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ ml: "auto" }}
				>
					{viewMode === "attributes"
						? `${filteredObjects.length} объектов`
						: `${filteredLinks.length} связей`}
				</Typography>
			</Box>

			{/* Table content */}
			<Box sx={{ flex: 1 }}>
				{viewMode === "attributes" ? (
					<AgGridReact
						rowData={filteredObjects}
						columnDefs={attributeColumnDefs}
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
				) : (
					<AgGridReact
						rowData={filteredLinks}
						columnDefs={linkColumnDefs}
						theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
						onRowClicked={handleLinkRowClicked}
						rowSelection="single"
						suppressCellFocus
						animateRows
						rowHeight={28}
						headerHeight={32}
					/>
				)}
			</Box>

			{/* Mapping Details Dialog */}
			{selectedConnection && (
				<MappingDetailsDialog
					open={isMappingDialogOpen}
					onClose={() => {
						setIsMappingDialogOpen(false);
						setSelectedLink(null);
					}}
					connection={selectedConnection}
				/>
			)}
		</Box>
	);
});

ObjectsPanel.displayName = "ObjectsPanel";
