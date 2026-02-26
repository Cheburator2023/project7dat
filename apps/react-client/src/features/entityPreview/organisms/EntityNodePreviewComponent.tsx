import React, { memo, useMemo, useState, useCallback } from "react";
import * as fuzzysort from "fuzzysort";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { EntityNodeData } from "../../entities/types";
import {
	TYPE_COLORS,
	HIGHLIGHT_COLORS,
	MAX_VISIBLE_ATTRS,
	TEMP_TABLE_COLORS,
	isTempTable,
} from "../../entities/constants";
import { useEntitiesStore } from "../../entities/stores";
import { ModelNodePreviewComponent } from "@react-client/features/modelPreview/organisms/ModelNodePreviewComponent";

type EntityNode = Node<EntityNodeData, "entityNode">;

const EMPTY_STRING_SET = new Set<string>();

const NODE_CONTAINER_STYLE = {
	background: "#fff",
	borderRadius: 8,
	width: 280,
	overflow: "hidden" as const,
	transition: "all 0.2s ease",
};

const HEADER_META_STYLE = {
	display: "flex",
	gap: 8,
	marginTop: 6,
	fontSize: 10,
	alignItems: "center" as const,
};

const ENTITY_TYPE_STYLE = {
	fontSize: 11,
	opacity: 0.8,
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
	marginBottom: 2,
};

const ENTITY_NAME_STYLE = {
	fontWeight: 600,
	fontSize: 13,
	color: "#333",
	whiteSpace: "nowrap" as const,
	overflow: "hidden" as const,
	textOverflow: "ellipsis" as const,
};

const ENTITY_NAMESPACE_STYLE = {
	fontSize: 10,
	color: "#666",
	whiteSpace: "nowrap" as const,
	overflow: "hidden" as const,
	textOverflow: "ellipsis" as const,
};

const HEADER_FLEX_STYLE = {
	display: "flex",
	justifyContent: "space-between" as const,
	alignItems: "flex-start" as const,
};

const HEADER_CONTENT_STYLE = {
	flex: 1,
	minWidth: 0,
};

const ATTR_COUNT_STYLE = {
	color: "#888",
	marginLeft: "auto" as const,
};

const NAV_BUTTON_BASE_STYLE = {
	padding: "2px 6px",
	background: "#1976d2",
	color: "#fff",
	border: "none",
	borderRadius: 4,
	fontSize: 9,
	fontWeight: 500,
	cursor: "pointer",
	display: "flex",
	alignItems: "center" as const,
	gap: 2,
};

const ATTR_NAME_STYLE = {
	whiteSpace: "nowrap" as const,
	overflow: "hidden" as const,
	textOverflow: "ellipsis" as const,
	flex: 1,
};

const ATTR_TYPE_STYLE = {
	color: "#999",
	marginLeft: 8,
	fontSize: 9,
};

const ENTITY_HANDLE_STYLE = {
	width: 10,
	height: 10,
	border: "2px solid #fff",
	top: 30,
};

// Stable selector for global attribute search
const selectGlobalAttributeSearch = (state: {
	globalAttributeSearchQuery: string;
}) => state.globalAttributeSearchQuery;

export const EntityNodePreviewComponent = memo(
	({ data, id }: NodeProps<EntityNode>) => {
		const {
			entity,
			isDisabled = false,
			highlightType,
			onNodeClick,
			onNodeDoubleClick,
			onAttrClick,
			onAttrHover,
			onViewDetails,
			upstreamCount,
			downstreamCount,
			graphId,
			highlightedSourceAttrs = EMPTY_STRING_SET,
			highlightedTargetAttrs = EMPTY_STRING_SET,
			selectedHighlightedAttrs = EMPTY_STRING_SET,
			isSearchActive = false,
			isSearchMatch = false,
			showAllAttrs = false,
			isExpanded = false,
			handleExpandToggle,
		} = data;
		const isTemp = isTempTable(entity);
		const isDisabledEffective = isDisabled || isTemp;
		const colors = isTemp
			? {
					bg: TEMP_TABLE_COLORS.bg,
					border: TEMP_TABLE_COLORS.border,
					text: TEMP_TABLE_COLORS.text,
				}
			: TYPE_COLORS[entity.type] || TYPE_COLORS.table;
		const attrs = entity.attrSeq || [];

		// Local search state
		const [localSearchQuery, setLocalSearchQuery] = useState("");

		// Get global attribute search from store with stable selector
		const globalAttributeSearchQuery = useEntitiesStore(
			selectGlobalAttributeSearch,
		);

		// Use global search if available, otherwise local
		const activeSearchQuery = globalAttributeSearchQuery || localSearchQuery;

		// Debounce store update for local search if needed, but here we just use local state primarily
		// Dashboard syncs with store, we can keep it simple here or match.
		// Let's match simple local state for now unless we need store sync.
		// Dashboard: const setLocalNodeAttributeSearch = useEntitiesStore(...)
		// EntityGraphPanelInner logic doesn't seem to use localNodeAttributeSearchQueries?
		// Checking EntityGraphPanelInner... it doesn't seem to pass localNodeAttributeSearchQueries or use it for filtering.
		// So local state is fine here.

		// Calculate related attributes (those with mappings)
		const relatedAttrNames = useMemo(() => {
			return new Set([
				...highlightedSourceAttrs,
				...highlightedTargetAttrs,
				...selectedHighlightedAttrs,
			]);
		}, [
			highlightedSourceAttrs,
			highlightedTargetAttrs,
			selectedHighlightedAttrs,
		]);

		const searchedAttrs = useMemo(() => {
			const q = activeSearchQuery.trim();
			if (!q || q.length < 2) return null;
			const results = fuzzysort.go(q, attrs, {
				keys: ["name", "type"],
				threshold: -10000,
			});
			return new Set(results.map((r) => r.obj.name));
		}, [activeSearchQuery, attrs]);

		const isExpandedEffective =
			isExpanded || selectedHighlightedAttrs.size > 0 || searchedAttrs !== null;

		const { visibleAttrs, moreCount } = useMemo(() => {
			if (!isExpandedEffective) {
				return { visibleAttrs: [], moreCount: 0 };
			}

			if (searchedAttrs) {
				const filtered = attrs.filter(
					(attr) =>
						searchedAttrs.has(attr.name) ||
						selectedHighlightedAttrs.has(attr.name),
				);
				return { visibleAttrs: filtered, moreCount: 0 };
			}

			if (selectedHighlightedAttrs.size > 0) {
				const filtered = attrs.filter((attr) =>
					selectedHighlightedAttrs.has(attr.name),
				);
				return { visibleAttrs: filtered, moreCount: 0 };
			}

			const allRelatedAttrs = showAllAttrs
				? attrs
				: attrs.filter((attr) => relatedAttrNames.has(attr.name));
			const maxAttrs = showAllAttrs ? 20 : MAX_VISIBLE_ATTRS;
			const limited = allRelatedAttrs.slice(0, maxAttrs);
			return {
				visibleAttrs: limited,
				moreCount: Math.max(0, allRelatedAttrs.length - limited.length),
			};
		}, [
			attrs,
			isExpandedEffective,
			relatedAttrNames,
			searchedAttrs,
			selectedHighlightedAttrs,
			showAllAttrs,
		]);

		const isSearchMatchHighlight = highlightType === "searchMatch";
		const borderColor =
			highlightType !== "none"
				? HIGHLIGHT_COLORS[highlightType as keyof typeof HIGHLIGHT_COLORS]
				: colors.border;
		const borderWidth =
			highlightType !== "none" ? (isSearchMatchHighlight ? 10 : 10) : 2;

		const shouldDim =
			isSearchActive && !isSearchMatch && highlightType === "none";
		const nodeOpacity = isDisabledEffective ? 0.35 : shouldDim ? 0.3 : 1;

		const handleNavClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				if (isDisabledEffective) return;
				onNodeClick?.(id);
			},
			[id, isDisabledEffective, onNodeClick],
		);

		const handleViewDetailsClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				if (isDisabledEffective) return;
				onViewDetails?.(id);
			},
			[id, isDisabledEffective, onViewDetails],
		);

		const handleAttrClickMemo = useCallback(
			(e: React.MouseEvent, attrName: string) => {
				e.stopPropagation();
				onAttrClick(id, attrName);
			},
			[id, onAttrClick],
		);

		const handleStopPropagation = useCallback((e: React.MouseEvent) => {
			e.stopPropagation();
		}, []);

		const nodeContainerStyle = useMemo(
			() => ({
				...NODE_CONTAINER_STYLE,
				border: `${borderWidth}px solid ${borderColor}`,
				boxShadow:
					highlightType !== "none"
						? `0 4px 20px ${borderColor}40`
						: "0 2px 8px rgba(0,0,0,0.1)",
				opacity: nodeOpacity,
				cursor: isDisabledEffective ? "not-allowed" : "pointer",
				filter: isDisabledEffective ? "grayscale(0.6)" : undefined,
			}),
			[
				borderWidth,
				borderColor,
				highlightType,
				isDisabledEffective,
				nodeOpacity,
			],
		);

		const headerStyle = useMemo(
			() => ({
				background: colors.bg,
				padding: "8px 12px",
				borderBottom: `1px solid ${colors.border}`,
			}),
			[colors.bg, colors.border],
		);

		const entityTypeStyle = useMemo(
			() => ({
				...ENTITY_TYPE_STYLE,
				color: colors.text,
			}),
			[colors.text],
		);

		const upstreamStyle = useMemo(
			() => ({ color: HIGHLIGHT_COLORS.upstream, fontWeight: 500 }),
			[],
		);

		const downstreamStyle = useMemo(
			() => ({ color: HIGHLIGHT_COLORS.downstream, fontWeight: 500 }),
			[],
		);

		const detailsButtonStyle = useMemo(
			() => ({
				...NAV_BUTTON_BASE_STYLE,
				backgroundColor: "#d26019",
				marginLeft: attrs.length > 0 ? 8 : "auto",
			}),
			[attrs.length],
		);

		const navButtonStyle = useMemo(
			() => ({
				...NAV_BUTTON_BASE_STYLE,
				marginLeft: attrs.length > 0 ? 8 : "auto",
			}),
			[attrs.length],
		);

		const entityTargetHandleStyle = useMemo(
			() => ({
				...ENTITY_HANDLE_STYLE,
				background: colors.border,
			}),
			[colors.border],
		);

		const entitySourceHandleStyle = useMemo(
			() => ({
				...ENTITY_HANDLE_STYLE,
				background: colors.border,
			}),
			[colors.border],
		);

		return (
			<div
				style={nodeContainerStyle}
				onDoubleClick={() => {
					if (isDisabledEffective) return;
					onNodeDoubleClick?.(id, graphId || "");
				}}
			>
				{/* Header */}
				<div style={headerStyle}>
					<div style={HEADER_FLEX_STYLE}>
						<div style={HEADER_CONTENT_STYLE}>
							<div style={entityTypeStyle}>
								{isTemp && (
									<span
										style={{
											background: TEMP_TABLE_COLORS.badge,
											color: "#fff",
											padding: "1px 4px",
											borderRadius: 3,
											fontSize: 9,
											textTransform: "none",
											marginRight: 6,
										}}
										title="Временная сущность"
									>
										TEMP
									</span>
								)}
								{entity.type}
							</div>
							<div style={ENTITY_NAME_STYLE} title={entity.name || entity.id}>
								{entity.name || entity.id}
							</div>
							{entity.namespace && (
								<div style={ENTITY_NAMESPACE_STYLE} title={entity.namespace}>
									{entity.namespace}
								</div>
							)}
						</div>
					</div>
					<div style={HEADER_META_STYLE}>
						{upstreamCount > 0 && (
							<span style={upstreamStyle}>← {upstreamCount}</span>
						)}
						{downstreamCount > 0 && (
							<span style={downstreamStyle}>→ {downstreamCount}</span>
						)}
						{attrs.length > 0 && (
							<span style={ATTR_COUNT_STYLE}>{attrs.length} атр.</span>
						)}
						{(entity.type as any) !== "model" && (
							<>
								<button
									onClick={handleViewDetailsClick}
									style={detailsButtonStyle}
									title={"Открыть детали"}
									type="button"
								>
									ⓘ
								</button>
								<button
									onClick={handleNavClick}
									style={navButtonStyle}
									title="Открыть страницу сущности"
									type="button"
								>
									↗
								</button>
							</>
						)}
					</div>
				</div>

				{/* Search input for attributes */}
				{!globalAttributeSearchQuery && (
					<div
						className="nodrag nopan"
						style={{
							padding: "8px 12px",
							borderBottom: "1px solid #e0e0e0",
						}}
						onPointerDown={handleStopPropagation}
						onMouseDown={handleStopPropagation}
					>
						<input
							type="text"
							placeholder="Поиск атрибутов (мин. 2 символа)..."
							value={localSearchQuery}
							onChange={(e) => setLocalSearchQuery(e.target.value)}
							onClick={handleStopPropagation}
							style={{
								width: "100%",
								padding: "4px 8px",
								fontSize: 10,
								border: "1px solid #ddd",
								borderRadius: 4,
								outline: "none",
							}}
						/>
					</div>
				)}

				{/* Related attributes */}
				{visibleAttrs.length > 0 && (
					<div>
						{visibleAttrs.map((attr, idx) => {
							const isSourceHighlighted = highlightedSourceAttrs.has(attr.name);
							const isTargetHighlighted = highlightedTargetAttrs.has(attr.name);

							const isSelectedHighlighted = selectedHighlightedAttrs.has(
								attr.name,
							);
							const leftArrow = isTargetHighlighted || isSelectedHighlighted;
							const rightArrow = isSourceHighlighted || isSelectedHighlighted;

							return (
								<div
									key={attr.name}
									onClick={(e) => handleAttrClickMemo(e, attr.name)}
									onMouseEnter={() => onAttrHover?.(id, attr.name)}
									onMouseLeave={() => onAttrHover?.(id, null)}
									style={{
										display: "flex",
										justifyContent: "space-between",
										padding: "3px 12px",
										fontSize: 10,
										borderBottom:
											idx < visibleAttrs.length - 1
												? "1px solid #f5f5f5"
												: "none",
										background: isSelectedHighlighted
											? `${HIGHLIGHT_COLORS.selected}70`
											: idx % 2 === 0
												? "#fafafa"
												: "#fff",
										position: "relative",
										cursor: "pointer",
										transition: "background 0.15s ease",
									}}
								>
									{/* Target handle for this attribute */}
									<Handle
										type="target"
										position={Position.Left}
										id={`attr-target-${attr.name}`}
										style={{
											background:
												isTargetHighlighted || isSelectedHighlighted
													? HIGHLIGHT_COLORS.selected
													: colors.border,
											width: isSelectedHighlighted ? 8 : 6,
											height: isSelectedHighlighted ? 8 : 6,
											left: -3,
											border: "1px solid #fff",
											transition: "all 0.15s ease",
										}}
									/>
									<input
										type="checkbox"
										checked={isSelectedHighlighted}
										readOnly
										style={{
											width: 12,
											height: 12,
											margin: 0,
											marginRight: 4,
											flexShrink: 0,
											cursor: "pointer",
											accentColor: HIGHLIGHT_COLORS.selected,
										}}
									/>
									<span
										style={{
											width: 12,
											color: leftArrow
												? HIGHLIGHT_COLORS.selected
												: "transparent",
											fontWeight: 700,
											flexShrink: 0,
										}}
									>
										←
									</span>
									<span
										style={{
											...ATTR_NAME_STYLE,
											color: isSelectedHighlighted ? "#333" : "#555",
											fontWeight: isSelectedHighlighted ? 600 : 400,
										}}
									>
										{attr.name}
									</span>
									<span style={ATTR_TYPE_STYLE}>{attr.type}</span>
									<span
										style={{
											width: 12,
											color: rightArrow
												? HIGHLIGHT_COLORS.selected
												: "transparent",
											fontWeight: 700,
											flexShrink: 0,
											textAlign: "right",
										}}
									>
										→
									</span>
									{/* Source handle for this attribute */}
									<Handle
										type="source"
										position={Position.Right}
										id={`attr-source-${attr.name}`}
										style={{
											background:
												isSourceHighlighted || isSelectedHighlighted
													? HIGHLIGHT_COLORS.selected
													: colors.border,
											width: isSelectedHighlighted ? 8 : 6,
											height: isSelectedHighlighted ? 8 : 6,
											right: -3,
											border: "1px solid #fff",
											transition: "all 0.15s ease",
										}}
									/>
								</div>
							);
						})}
						{moreCount > 0 &&
							searchedAttrs === null &&
							selectedHighlightedAttrs.size === 0 && (
								<div
									onClick={(e) => {
										e.stopPropagation();
										handleExpandToggle?.(id);
									}}
									style={{
										padding: "4px 12px",
										fontSize: 10,
										color: "#1976d2",
										background: "#f8f9fa",
										textAlign: "center",
										cursor: "pointer",
									}}
								>
									+{moreCount} ещё...
								</div>
							)}
					</div>
				)}

				{/* Main entity-level handles (fallback when no attribute mapping) */}
				<Handle
					type="target"
					position={Position.Left}
					id="entity-target"
					style={entityTargetHandleStyle}
				/>
				<Handle
					type="source"
					position={Position.Right}
					id="entity-source"
					style={entitySourceHandleStyle}
				/>
			</div>
		);
	},
);

EntityNodePreviewComponent.displayName = "EntityNodePreviewComponent";

interface DepthGroupNodeData {
	label?: string;
	[key: string]: unknown;
}

type DepthGroupNodeType = Node<DepthGroupNodeData, "depthGroup">;

const DepthGroupNode = memo<NodeProps<DepthGroupNodeType>>(({ data }) => {
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				justifyContent: "flex-start",
				pointerEvents: "none",
			}}
		>
			<div
				style={{
					fontSize: 12,
					fontWeight: 600,
					padding: "6px 10px",
					color: "#333",
					pointerEvents: "none",
				}}
			>
				{data.label ?? ""}
			</div>
		</div>
	);
});

DepthGroupNode.displayName = "DepthGroupNode";

interface GhostNodeData extends Record<string, unknown> {
	direction: "upstream" | "downstream";
	boundaryNodeId: string;
	onClickGhost: () => void;
}

type GhostNode = Node<GhostNodeData, "ghostNode">;

export const GhostNodeComponent = memo(({ data }: NodeProps<GhostNode>) => {
	const isUpstream = data.direction === "upstream";
	return (
		<div
			onClick={data.onClickGhost}
			onKeyDown={(e) => {
				if (e.key === "Enter") data.onClickGhost();
			}}
			role="button"
			tabIndex={0}
			style={{
				padding: "8px 16px",
				borderRadius: 8,
				border: `2px dashed ${isUpstream ? "#6366f1" : "#f59e0b"}`,
				background: isUpstream ? "#eef2ff" : "#fffbeb",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 6,
				fontSize: 11,
				color: isUpstream ? "#4f46e5" : "#aa5c03",
				fontWeight: 500,
				minWidth: 250,
				opacity: 0.9,
				transition: "opacity 0.15s",
			}}
		>
			<Handle
				type="target"
				position={Position.Left}
				id="ghost-target"
				style={{ opacity: 0, width: 1, height: 1 }}
			/>
			<span>{isUpstream ? "⬆" : "⬇"}</span>
			<span>Ещё</span>
			<Handle
				type="source"
				position={Position.Right}
				id="ghost-source"
				style={{ opacity: 0, width: 1, height: 1 }}
			/>
		</div>
	);
});

GhostNodeComponent.displayName = "GhostNodeComponent";

export const graphNodeTypes = {
	entityNode: EntityNodePreviewComponent,
	ghostNode: GhostNodeComponent,
	depthGroup: DepthGroupNode,
	modelNode: ModelNodePreviewComponent,
};
