import { memo, useCallback, useMemo, useState } from "react";
import { PaginationToolbar } from "@react-client/common/grid/PaginationToolbar";
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
import { MappingDetailsDialog } from "@react-client/features/entityPreview/components/MappingDetailsDialog";

import { useDashboardStore } from "../stores";
import { useCurrentSchema } from "../hooks/useCurrentSchema";
import { LoadingSpinner, ObjectTypeChip } from "../atoms";
import { HIGHLIGHT_COLORS } from "../constants";
import { fuzzySearchObjects, fuzzySearchLinks } from "../utils";
import { EntityContextMenu, type EntityContextMenuState } from "../molecules";
import type { ObjectRow, LinkRow, EntityConnection } from "../types";

const OBJECTS_PAGE_SIZES = [25, 50, 100, 200];

export const ObjectsPanel = memo(() => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const navigate = useNavigate();

	// Client-side pagination
	const [objectsPage, setObjectsPage] = useState(1);
	const [objectsPageSize, setObjectsPageSize] = useState(50);
	const [linksPage, setLinksPage] = useState(1);
	const [linksPageSize, setLinksPageSize] = useState(50);

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
			mapping.deps.forEach((dep, depIndex) => {
				const sourceEntity = entityMap.get(dep.entityId);
				const targetEntity = entityMap.get(mapping.entityId);
				if (!sourceEntity || !targetEntity) return;

				const attrMaps = dep.attrMaps || [];
				const processFallbackId = mapping.processId ?? mapping.id;
				const normalizedProcessFallbackId =
					processFallbackId != null &&
					String(processFallbackId).trim() !== "" &&
					String(processFallbackId).toLowerCase() !== "undefined" &&
					String(processFallbackId).toLowerCase() !== "null"
						? String(processFallbackId)
						: null;
				const processName =
					mapping.process?.trim() ||
					(normalizedProcessFallbackId
						? `Процесс #${normalizedProcessFallbackId}`
						: "Процесс не указан");
				rows.push({
					id: `${effectiveGraphId}::${dep.entityId}->${mapping.entityId}::${mapping.id}::${depIndex}`,
					graphId: effectiveGraphId || "",
					sourceEntity: dep.entityId,
					sourceName: sourceEntity.name || sourceEntity.id,
					targetEntity: mapping.entityId,
					targetName: targetEntity.name || targetEntity.id,
					processName,
					processId: mapping.processId,
					processCode: mapping.system_code || dep.system_code,
					attrMappingsCount: attrMaps.length,
					attrMaps,
				});
			});
		});

		return rows;
	}, [currentSchema, effectiveGraphId]);

	// Filter by selected entity first
	const entityFilteredObjects = useMemo(() => {
		if (selectedEntityId) {
			return objects.filter((o) => o.parentEntity === selectedEntityId);
		}
		return objects;
	}, [objects, selectedEntityId]);

	// Fuzzy search objects
	const fuzzyObjectResults = useMemo(() => {
		return fuzzySearchObjects(entityFilteredObjects, globalSearchQuery);
	}, [entityFilteredObjects, globalSearchQuery]);

	// Create highlights map for objects
	const objectHighlightsMap = useMemo(() => {
		const map = new Map<string, Map<string, string>>();
		for (const result of fuzzyObjectResults) {
			if (result.highlights.size > 0) {
				map.set(result.item.id, result.highlights);
			}
		}
		return map;
	}, [fuzzyObjectResults]);

	// Get filtered objects (sorted by fuzzy score)
	const allFilteredObjects = useMemo(() => {
		return fuzzyObjectResults.map((r) => r.item);
	}, [fuzzyObjectResults]);

	const totalObjects = allFilteredObjects.length;
	const totalObjectsPages = Math.ceil(totalObjects / objectsPageSize) || 1;
	const filteredObjects = useMemo(() => {
		const offset = (objectsPage - 1) * objectsPageSize;
		return allFilteredObjects.slice(offset, offset + objectsPageSize);
	}, [allFilteredObjects, objectsPage, objectsPageSize]);

	// Filter links by selected entity first
	const entityFilteredLinks = useMemo(() => {
		if (selectedEntityId) {
			return links.filter(
				(l) =>
					l.sourceEntity === selectedEntityId ||
					l.targetEntity === selectedEntityId,
			);
		}
		return links;
	}, [links, selectedEntityId]);

	// Fuzzy search links
	const fuzzyLinkResults = useMemo(() => {
		return fuzzySearchLinks(entityFilteredLinks, globalSearchQuery);
	}, [entityFilteredLinks, globalSearchQuery]);

	// Create highlights map for links
	const linkHighlightsMap = useMemo(() => {
		const map = new Map<string, Map<string, string>>();
		for (const result of fuzzyLinkResults) {
			if (result.highlights.size > 0) {
				map.set(result.item.id, result.highlights);
			}
		}
		return map;
	}, [fuzzyLinkResults]);

	// Get filtered links (sorted by fuzzy score)
	const allFilteredLinks = useMemo(() => {
		return fuzzyLinkResults.map((r) => r.item);
	}, [fuzzyLinkResults]);

	const totalLinks = allFilteredLinks.length;
	const totalLinksPages = Math.ceil(totalLinks / linksPageSize) || 1;
	const filteredLinks = useMemo(() => {
		const offset = (linksPage - 1) * linksPageSize;
		return allFilteredLinks.slice(offset, offset + linksPageSize);
	}, [allFilteredLinks, linksPage, linksPageSize]);

	const handleObjectsPageSizeChange = useCallback((size: number) => {
		setObjectsPageSize(size);
		setObjectsPage(1);
	}, []);

	const handleLinksPageSizeChange = useCallback((size: number) => {
		setLinksPageSize(size);
		setLinksPage(1);
	}, []);

	// Navigate to object page based on type
	const handleNavigateToObject = useCallback(
		(data: ObjectRow) => {
			const encodedEntityId = encodeURIComponent(data.parentEntity);
			if (data.objectType === "Признак") {
				// Attribute → open entity page with attribute highlight
				navigate(
					`/entity/${encodedEntityId}?highlightAttr=${encodeURIComponent(data.name)}`,
				);
			} else {
				// Entity (Источник/Витрина) → open entity page
				navigate(`/entity/${encodedEntityId}`);
			}
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
				cellRenderer: ({ value, data }: { value: string; data: ObjectRow }) => {
					const highlights = objectHighlightsMap.get(data.id);
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
				cellRenderer: ({ value, data }: { value: string; data: ObjectRow }) => {
					const highlights = objectHighlightsMap.get(data.id);
					const highlightedDesc = highlights?.get("description");
					if (highlightedDesc) {
						return (
							<span
								dangerouslySetInnerHTML={{ __html: highlightedDesc }}
								style={{ display: "block" }}
							/>
						);
					}
					return value;
				},
			},
		],
		[objectHighlightsMap],
	);

	// Column definitions for links
	const linkColumnDefs: ColDef<LinkRow>[] = useMemo(
		() => [
			{
				field: "sourceName",
				headerName: "Источник",
				flex: 1,
				cellRenderer: ({ value, data }: { value: string; data: LinkRow }) => {
					const highlights = linkHighlightsMap.get(data.id);
					const highlightedSource = highlights?.get("sourceName");
					if (highlightedSource) {
						return (
							<Typography
								variant="body2"
								fontWeight={500}
								dangerouslySetInnerHTML={{ __html: highlightedSource }}
							/>
						);
					}
					return (
						<Typography variant="body2" fontWeight={500}>
							{value}
						</Typography>
					);
				},
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
				cellRenderer: ({ value, data }: { value: string; data: LinkRow }) => {
					const highlights = linkHighlightsMap.get(data.id);
					const highlightedTarget = highlights?.get("targetName");
					if (highlightedTarget) {
						return (
							<Typography
								variant="body2"
								fontWeight={500}
								dangerouslySetInnerHTML={{ __html: highlightedTarget }}
							/>
						);
					}
					return (
						<Typography variant="body2" fontWeight={500}>
							{value}
						</Typography>
					);
				},
			},
			{
				field: "processName",
				headerName: "Процесс",
				flex: 1,
				minWidth: 220,
				cellRenderer: ({ value, data }: { value: string; data: LinkRow }) => {
					const highlights = linkHighlightsMap.get(data.id);
					const highlightedProcessName = highlights?.get("processName");
					const highlightedProcessCode = highlights?.get("processCode");

					return (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
							<Chip
								label={value}
								size="small"
								color="secondary"
								variant="filled"
								sx={{
									maxWidth: "100%",
									"& .MuiChip-label": {
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									},
								}}
							/>
							{data.processCode ? (
								<Typography variant="caption" color="text.secondary">
									{highlightedProcessCode ? (
										<span
											dangerouslySetInnerHTML={{
												__html: highlightedProcessCode,
											}}
										/>
									) : (
										data.processCode
									)}
								</Typography>
							) : null}
							{highlightedProcessName ? (
								<Typography
									variant="caption"
									color="text.secondary"
									dangerouslySetInnerHTML={{ __html: highlightedProcessName }}
								/>
							) : null}
						</Box>
					);
				},
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
		[linkHighlightsMap],
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

	// Context menu state
	const [contextMenu, setContextMenu] = useState<EntityContextMenuState | null>(
		null,
	);

	const handleCellContextMenu = useCallback(
		(event: CellContextMenuEvent<ObjectRow>) => {
			event.event?.preventDefault();
			if (event.data) {
				const mouseEvent = event.event as MouseEvent;
				setContextMenu({
					entityId: event.data.parentEntity,
					entityName: event.data.name,
					entityType: event.data.objectType,
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

				const processFallbackId = mapping.processId ?? mapping.id;
				const normalizedProcessFallbackId =
					processFallbackId != null &&
					String(processFallbackId).trim() !== "" &&
					String(processFallbackId).toLowerCase() !== "undefined" &&
					String(processFallbackId).toLowerCase() !== "null"
						? String(processFallbackId)
						: null;
				const processName =
					mapping.process?.trim() ||
					(normalizedProcessFallbackId
						? `Процесс #${normalizedProcessFallbackId}`
						: "Процесс не указан");
				connections.push({
					id: `${dep.entityId}->${mapping.entityId}::${mapping.id}`,
					sourceId: dep.entityId,
					targetId: mapping.entityId,
					sourceName: sourceEntity.name,
					targetName: targetEntity.name,
					processName,
					processId: mapping.processId,
					processCode: mapping.system_code || dep.system_code,
					attrMaps: dep.attrMaps || [],
					description: "",
				});
			}
		}
		return connections;
	}, [currentSchema]);

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
				processName: selectedLink.processName,
				processId: selectedLink.processId,
				processCode: selectedLink.processCode,
				attrMaps: selectedLink.attrMaps,
				description: "",
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
						? `${totalObjects} объектов`
						: `${totalLinks} связей`}
				</Typography>
			</Box>

			{/* Table content */}
			<Box sx={{ flex: 1, minHeight: 0 }}>
				{viewMode === "attributes" ? (
					<AgGridReact
						rowData={filteredObjects}
						columnDefs={attributeColumnDefs}
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

			{viewMode === "attributes" ? (
				<PaginationToolbar
					page={objectsPage}
					totalPages={totalObjectsPages}
					totalItems={totalObjects}
					pageSize={objectsPageSize}
					onPageChange={setObjectsPage}
					onPageSizeChange={handleObjectsPageSizeChange}
					itemLabel="объектов"
					pageSizeOptions={OBJECTS_PAGE_SIZES}
				/>
			) : (
				<PaginationToolbar
					page={linksPage}
					totalPages={totalLinksPages}
					totalItems={totalLinks}
					pageSize={linksPageSize}
					onPageChange={setLinksPage}
					onPageSizeChange={handleLinksPageSizeChange}
					itemLabel="связей"
					pageSizeOptions={OBJECTS_PAGE_SIZES}
				/>
			)}

			<EntityContextMenu
				contextMenu={contextMenu}
				onClose={handleCloseContextMenu}
				entity={contextMenuEntity}
				connections={entityConnections}
			/>

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
