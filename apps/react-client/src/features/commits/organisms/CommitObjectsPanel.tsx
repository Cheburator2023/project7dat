import { memo, useMemo, useCallback, useState, useRef } from "react";
import { Box, Typography, Chip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { AgGridReact } from "ag-grid-react";
import type {
	ColDef,
	GridApi,
	GridReadyEvent,
	RowClickedEvent,
} from "ag-grid-community";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import type { EntityConnection } from "@react-client/features/entities/types";
import { MappingDetailsDialog } from "@react-client/features/entityPreview/components/MappingDetailsDialog";
import {
	useCommitMergeStore,
	extractCommitEntities,
	extractCommitMappings,
} from "../stores/commitMergeStore";
import { AgGridStateControls } from "@react-client/common/grid/AgGridStateControls";
import { useAgGridPersistence } from "@react-client/common/grid/hooks/useAgGridPersistence";

interface ObjectRow {
	id: string;
	name: string;
	objectType: "Витрина" | "Источник" | "Признак";
	parentEntity: string;
	dataType?: string;
	description?: string;
}

interface LinkRow {
	id: string;
	sourceEntity: string;
	sourceName: string;
	targetEntity: string;
	targetName: string;
	processName: string;
	processId?: number;
	processCode?: string;
	attrMappingsCount: number;
	attrMaps: Array<{ src: string; dst: string }>;
}

export const CommitObjectsPanel = memo(() => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";

	const { commit, selectedEntityId, setSelectedEntityId } =
		useCommitMergeStore();

	const entities = useMemo(() => extractCommitEntities(commit), [commit]);
	const mappings = useMemo(() => extractCommitMappings(commit), [commit]);

	const [selectedLink, setSelectedLink] = useState<LinkRow | null>(null);
	const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);

	const objects: ObjectRow[] = useMemo(() => {
		const rows: ObjectRow[] = [];
		for (const entity of entities) {
			rows.push({
				id: `obj::${entity.id}`,
				name: entity.name ?? entity.id,
				objectType: entity.modified ? "Витрина" : "Источник",
				parentEntity: entity.id,
				description: entity.description ?? "",
			});
			for (const attr of entity.attrSeq ?? []) {
				rows.push({
					id: `obj::${entity.id}::${attr.name}`,
					name: attr.name,
					objectType: "Признак",
					parentEntity: entity.id,
					dataType: attr.type,
					description: attr.comment ?? "",
				});
			}
		}
		return rows;
	}, [entities]);

	const links: LinkRow[] = useMemo(() => {
		const rows: LinkRow[] = [];
		const entityMap = new Map<string, { id: string; name?: string | null }>();
		for (const e of entities) entityMap.set(e.id, e);

		for (const mapping of mappings) {
			if (!mapping.deps) continue;
			for (const dep of mapping.deps) {
				const src = entityMap.get(dep.entityId);
				const tgt = entityMap.get(mapping.entityId);
				if (!src || !tgt) continue;
				const attrMaps = dep.attrMaps || [];
				rows.push({
					id: `link::${dep.entityId}->${mapping.entityId}`,
					sourceEntity: dep.entityId,
					sourceName: src.name || src.id,
					targetEntity: mapping.entityId,
					targetName: tgt.name || tgt.id,
					processName: dep.process || "Процесс не указан",
					processId: dep.process_id,
					processCode: mapping.system_code || dep.system_code,
					attrMappingsCount: attrMaps.length,
					attrMaps,
				});
			}
		}
		return rows;
	}, [entities, mappings]);

	const filteredObjects = useMemo(() => {
		if (!selectedEntityId) return objects;
		return objects.filter((o) => o.parentEntity === selectedEntityId);
	}, [objects, selectedEntityId]);

	const filteredLinks = useMemo(() => {
		if (!selectedEntityId) return links;
		return links.filter(
			(l) =>
				l.sourceEntity === selectedEntityId ||
				l.targetEntity === selectedEntityId,
		);
	}, [links, selectedEntityId]);

	const objectColumnDefs: ColDef<ObjectRow>[] = useMemo(
		() => [
			{ field: "name", headerName: "Объект", flex: 2 },
			{
				field: "objectType",
				headerName: "Тип",
				width: 100,
				cellRenderer: ({ value }: { value: string }) => (
					<Chip
						label={value}
						size="small"
						variant="outlined"
						color={
							value === "Витрина"
								? "warning"
								: value === "Признак"
									? "info"
									: "default"
						}
					/>
				),
			},
			{
				field: "dataType",
				headerName: "Тип данных",
				width: 120,
				cellRenderer: ({ value }: { value?: string }) =>
					value ? <Chip label={value} size="small" variant="outlined" /> : null,
			},
			{ field: "description", headerName: "Описание", flex: 1 },
		],
		[],
	);

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
				width: 40,
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
				field: "processName",
				headerName: "Процесс",
				flex: 1,
				cellRenderer: ({ value }: { value: string }) => (
					<Chip label={value} size="small" color="secondary" variant="filled" />
				),
			},
			{
				field: "attrMappingsCount",
				headerName: "Маппинги",
				width: 90,
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

	const handleObjectRowClicked = useCallback(
		(event: RowClickedEvent<ObjectRow>) => {
			if (event.data && event.data.objectType !== "Признак") {
				setSelectedEntityId(event.data.parentEntity);
			}
		},
		[setSelectedEntityId],
	);

	const handleLinkRowClicked = useCallback(
		(event: RowClickedEvent<LinkRow>) => {
			if (event.data) {
				setSelectedLink(event.data);
				setIsMappingDialogOpen(true);
			}
		},
		[],
	);

	const objectsGridApiRef = useRef<GridApi | null>(null);
	const linksGridApiRef = useRef<GridApi | null>(null);
	const objectsGridPersistence = useAgGridPersistence({
		gridId: "commit-objects",
		gridName: "Коммит: объекты",
		apiRef: objectsGridApiRef,
	});
	const linksGridPersistence = useAgGridPersistence({
		gridId: "commit-links",
		gridName: "Коммит: связи",
		apiRef: linksGridApiRef,
	});

	const handleObjectsGridReady = useCallback(
		(event: GridReadyEvent) => {
			objectsGridPersistence.onGridReady(event as unknown as GridReadyEvent);
			objectsGridApiRef.current = event.api;
		},
		[objectsGridPersistence],
	);

	const handleLinksGridReady = useCallback(
		(event: GridReadyEvent) => {
			linksGridPersistence.onGridReady(event as unknown as GridReadyEvent);
			linksGridApiRef.current = event.api;
		},
		[linksGridPersistence],
	);

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
			<Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
				<AgGridStateControls
					onReset={objectsGridPersistence.resetGridState}
					resetTitle="Сбросить настройки таблицы (объекты)"
				/>
				<AgGridReact
					rowData={filteredObjects}
					columnDefs={objectColumnDefs}
					theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
					onGridReady={handleObjectsGridReady}
					onColumnMoved={objectsGridPersistence.onColumnMoved}
					onColumnPinned={objectsGridPersistence.onColumnPinned}
					onColumnResized={objectsGridPersistence.onColumnResized}
					onColumnVisible={objectsGridPersistence.onColumnVisible}
					onRowClicked={handleObjectRowClicked}
					rowSelection="single"
					suppressCellFocus
					animateRows
					rowHeight={28}
					headerHeight={32}
					overlayNoRowsTemplate="Нет объектов"
					onSortChanged={objectsGridPersistence.onSortChanged}
				/>
			</Box>
			<Box
				sx={{
					borderTop: 1,
					borderColor: "divider",
					flex: 1,
					minHeight: 0,
				}}
			>
				<Box sx={{ position: "relative", height: "100%" }}>
					<AgGridStateControls
						onReset={linksGridPersistence.resetGridState}
						resetTitle="Сбросить настройки таблицы (связи)"
					/>
					<AgGridReact
						rowData={filteredLinks}
						columnDefs={linkColumnDefs}
						theme={isDark ? agGridCustomMUIThemeDark : agGridCustomMUITheme}
						onGridReady={handleLinksGridReady}
						onColumnMoved={linksGridPersistence.onColumnMoved}
						onColumnPinned={linksGridPersistence.onColumnPinned}
						onColumnResized={linksGridPersistence.onColumnResized}
						onColumnVisible={linksGridPersistence.onColumnVisible}
						onRowClicked={handleLinkRowClicked}
						rowSelection="single"
						suppressCellFocus
						animateRows
						rowHeight={28}
						headerHeight={32}
						overlayNoRowsTemplate="Нет связей"
						onSortChanged={linksGridPersistence.onSortChanged}
					/>
				</Box>
			</Box>

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

CommitObjectsPanel.displayName = "CommitObjectsPanel";
