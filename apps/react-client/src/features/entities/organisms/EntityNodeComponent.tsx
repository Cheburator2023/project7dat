import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as fuzzysort from "fuzzysort";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import {
	TYPE_COLORS,
	HIGHLIGHT_COLORS,
	MAX_VISIBLE_ATTRS,
	TEMP_TABLE_COLORS,
	isTempTable,
} from "../constants";
import { useEntitiesStore } from "../stores";
import type { EntityNodeData } from "../types";

type EntityNode = Node<EntityNodeData, "entityNode">;

const EMPTY_STRING_SET = new Set<string>();

const selectAttributeSearchByGraphId = (state: {
	attributeSearchQueryByGraphId: Record<string, string>;
}) => state.attributeSearchQueryByGraphId;

export const EntityNodeComponent = memo(
	({ data, id }: NodeProps<EntityNode>) => {
		const {
			entity,
			isDisabled = false,
			highlightType,
			onNodeClick,
			onNodeDoubleClick,
			onOpenEntity,
			onViewDetails,
			onAttrClick,
			onAttrHover,
			graphId,
			upstreamCount,
			downstreamCount,
			highlightedSourceAttrs = EMPTY_STRING_SET,
			highlightedTargetAttrs = EMPTY_STRING_SET,
			selectedHighlightedAttrs = EMPTY_STRING_SET,
			attributeSearchMatchedAttrs = EMPTY_STRING_SET,
			isSearchActive = false,
			isSearchMatch = false,
			showAllAttrs = false,
			isExpanded = false,
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

		const [localSearchQuery, setLocalSearchQuery] = useState("");
		const attributeSearchQueryByGraphId = useEntitiesStore(
			selectAttributeSearchByGraphId,
		);
		const setLocalNodeAttributeSearch = useEntitiesStore(
			(state) => state.setLocalNodeAttributeSearch,
		);
		const graphAttributeSearchQuery = graphId
			? (attributeSearchQueryByGraphId[graphId] ?? "")
			: "";
		const activeSearchQuery = graphAttributeSearchQuery || localSearchQuery;

		// Debounce store update for local search
		const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
		useEffect(() => {
			return () => {
				if (debounceRef.current) clearTimeout(debounceRef.current);
			};
		}, []);

		const handleStopPropagation = useCallback((e: React.MouseEvent) => {
			e.stopPropagation();
		}, []);

		const handleNavClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				if (isDisabledEffective) return;
				if (onOpenEntity) {
					onOpenEntity(entity.id);
					return;
				}
				onNodeClick?.(id);
			},
			[entity.id, id, isDisabledEffective, onNodeClick, onOpenEntity],
		);

		const handleViewDetailsClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				if (isDisabledEffective) return;
				onViewDetails?.(id);
			},
			[id, isDisabledEffective, onViewDetails],
		);

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
			isExpanded ||
			selectedHighlightedAttrs.size > 0 ||
			attributeSearchMatchedAttrs.size > 0 ||
			searchedAttrs !== null;

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

			if (attributeSearchMatchedAttrs.size > 0) {
				const filtered = attrs.filter(
					(attr) =>
						attributeSearchMatchedAttrs.has(attr.name) ||
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
			attributeSearchMatchedAttrs,
			showAllAttrs,
		]);

		const _isDataMart = upstreamCount > 0 && downstreamCount === 0;
		const _isSource = upstreamCount === 0 && downstreamCount > 0;

		const isSearchMatchHighlight = highlightType === "searchMatch";
		const borderColor =
			highlightType !== "none"
				? HIGHLIGHT_COLORS[highlightType as keyof typeof HIGHLIGHT_COLORS]
				: colors.border;
		// Search matches get a pulsing glow effect via different border width
		const borderWidth =
			highlightType !== "none" ? (isSearchMatchHighlight ? 10 : 5) : 3;

		// Dim non-matching nodes when search is active
		const shouldDim =
			isSearchActive && !isSearchMatch && highlightType === "none";
		const nodeOpacity = isDisabledEffective ? 0.35 : shouldDim ? 0.3 : 1;

		return (
			<div
				style={{
					background: "#fff",
					border: `${borderWidth}px solid ${borderColor}`,
					borderRadius: 8,
					width: 320,
					boxShadow:
						highlightType !== "none"
							? `0 4px 20px ${borderColor}40`
							: "0 2px 8px rgba(0,0,0,0.1)",
					overflow: "hidden",
					cursor: isDisabledEffective ? "not-allowed" : "pointer",
					opacity: nodeOpacity,
					transition: "all 0.2s ease",
					filter: isDisabledEffective ? "grayscale(0.6)" : undefined,
					pointerEvents: isDisabledEffective ? "none" : "auto",
				}}
				onDoubleClick={() => {
					if (isDisabledEffective) return;
					onNodeDoubleClick(id, graphId);
				}}
			>
				{/* Header */}
				<div
					style={{
						background: colors.bg,
						padding: "8px 12px",
						borderBottom: `1px solid ${colors.border}`,
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "flex-start",
						}}
					>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div
								style={{
									fontSize: 11,
									color: colors.text,
									opacity: 0.8,
									textTransform: "uppercase",
									letterSpacing: "0.5px",
									marginBottom: 2,
								}}
							>
								{isTemp && (
									<span
										style={{
											background: TEMP_TABLE_COLORS.badge,
											color: "#fff",
											padding: "1px 4px",
											borderRadius: 3,
											fontSize: 9,
											textTransform: "none",
										}}
										title="Временная сущность"
									>
										TEMP
									</span>
								)}
								{entity.type && (
									<span
										style={{
											background: "#ed1515",
											color: "#fff",
											padding: "1px 4px",
											borderRadius: 3,
											fontSize: 9,
											textTransform: "none",
										}}
										title="Система"
									>
										Тип: {entity.type}
									</span>
								)}
								{entity.system_code && (
									<span
										style={{
											marginLeft: 6,
											background: "#607d8b",
											color: "#fff",
											padding: "1px 4px",
											borderRadius: 3,
											fontSize: 9,
											textTransform: "none",
										}}
										title="Система"
									>
										Система: {entity.system_code}
									</span>
								)}

								{/* {isDataMart && (
									<span
										style={{
											marginLeft: 6,
											background: "#9c27b0",
											color: "#fff",
											padding: "1px 4px",
											borderRadius: 3,
											fontSize: 9,
										}}
										title="Витрина данных"
									>
										витрина
									</span>
								)}
								{isSource && (
									<span
										style={{
											marginLeft: 6,
											background: "#00897b",
											color: "#fff",
											padding: "1px 4px",
											borderRadius: 3,
											fontSize: 9,
										}}
										title="Источник данных"
									>
										источник
									</span>
								)} */}
							</div>
							<div
								style={{
									fontWeight: 600,
									fontSize: 13,
									color: "#333",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
								title={entity.name || entity.id}
							>
								{entity.name || entity.id}
							</div>
							{entity.namespace && (
								<div
									style={{
										fontSize: 10,
										color: "#666",
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
									}}
									title={entity.namespace}
								>
									{entity.namespace}
								</div>
							)}
						</div>
					</div>
					<div
						style={{
							display: "flex",
							gap: 8,
							marginTop: 6,
							fontSize: 10,
							alignItems: "center",
						}}
					>
						{upstreamCount > 0 && (
							<span
								style={{ color: HIGHLIGHT_COLORS.upstream, fontWeight: 500 }}
							>
								← {upstreamCount}
							</span>
						)}
						{downstreamCount > 0 && (
							<span
								style={{ color: HIGHLIGHT_COLORS.downstream, fontWeight: 500 }}
							>
								→ {downstreamCount}
							</span>
						)}
						<span style={{ color: "#888", marginLeft: "auto" }}>
							{attrs.length} атр.
						</span>
						{onViewDetails && (
							<button
								onClick={handleViewDetailsClick}
								style={{
									padding: "2px 6px",
									background: "#d26019",
									color: "#fff",
									border: "none",
									borderRadius: 4,
									fontSize: 9,
									fontWeight: 500,
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									gap: 2,
								}}
								title="Открыть детали"
								type="button"
							>
								ⓘ
							</button>
						)}
						{onOpenEntity && (
							<button
								onClick={handleNavClick}
								style={{
									padding: "2px 6px",
									background: "#1976d2",
									color: "#fff",
									border: "none",
									borderRadius: 4,
									fontSize: 9,
									fontWeight: 500,
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									gap: 2,
								}}
								title="Открыть страницу сущности"
								type="button"
							>
								↗
							</button>
						)}
					</div>
				</div>

				{!graphAttributeSearchQuery && (
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
							onChange={(e) => {
								const next = e.target.value;
								setLocalSearchQuery(next);
								if (debounceRef.current) clearTimeout(debounceRef.current);
								debounceRef.current = setTimeout(() => {
									setLocalNodeAttributeSearch(entity.id, next);
								}, 300);
							}}
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
							const isAttributeSearchMatched = attributeSearchMatchedAttrs.has(
								attr.name,
							);
							const leftArrow = isTargetHighlighted || isSelectedHighlighted;
							const rightArrow = isSourceHighlighted || isSelectedHighlighted;
							return (
								<div
									key={attr.name}
									onClick={(e) => {
										e.stopPropagation();
										onAttrClick(id, attr.name);
									}}
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
											: isAttributeSearchMatched
												? `${HIGHLIGHT_COLORS.searchMatch}25`
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
											color: isSelectedHighlighted ? "#333" : "#555",
											whiteSpace: "nowrap",
											overflow: "hidden",
											textOverflow: "ellipsis",
											flex: 1,
											fontWeight: isSelectedHighlighted ? 600 : 400,
										}}
									>
										{attr.name}
									</span>
									<span style={{ color: "#999", marginLeft: 8, fontSize: 9 }}>
										{attr.type}
									</span>
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
									style={{
										padding: "4px 12px",
										fontSize: 10,
										color: "#1976d2",
										background: "#f8f9fa",
										textAlign: "center",
									}}
									data-name="more_attrs_node"
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
					style={{
						background: colors.border,
						width: 10,
						height: 10,
						border: "2px solid #fff",
						top: 30,
					}}
				/>
				<Handle
					type="source"
					position={Position.Right}
					id="entity-source"
					style={{
						background: colors.border,
						width: 10,
						height: 10,
						border: "2px solid #fff",
						top: 30,
					}}
				/>
			</div>
		);
	},
);

EntityNodeComponent.displayName = "EntityNodeComponent";

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
	entityNode: EntityNodeComponent,
	ghostNode: GhostNodeComponent,
	depthGroup: DepthGroupNode,
};
