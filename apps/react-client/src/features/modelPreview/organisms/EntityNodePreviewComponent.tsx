import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { EntityNodeData } from "../../dashboard/types";
import { TYPE_COLORS, HIGHLIGHT_COLORS } from "../../dashboard/constants";

type EntityNode = Node<EntityNodeData, "entityNode">;

const DEFAULT_VISIBLE_ATTRS = 10;

export const EntityNodePreviewComponent = memo(
	({ data, id }: NodeProps<EntityNode>) => {
		const {
			entity,
			highlightType,
			onNodeClick,
			onNodeDoubleClick,
			onAttrHover,
			onAttrClick,
			graphId,
			upstreamCount,
			downstreamCount,
			highlightedSourceAttrs = new Set<string>(),
			highlightedTargetAttrs = new Set<string>(),
			hoverHighlightedAttrs = new Set<string>(),
			selectedHighlightedAttrs = new Set<string>(),
			isSearchActive = false,
			isSearchMatch = false,
			showAllAttrs = false,
			onExpandToggle,
			isExpanded = false,
		} = data;
		const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.table;
		const attrs = entity.attrSeq || [];

		// Show only related attributes (those that have mappings), limited by MAX_VISIBLE_ATTRS
		// Or show all attrs if showAllAttrs is true (for entity preview page)
		// Also include selected highlighted attrs so they're always visible when navigating from entity page
		const relatedAttrNames = new Set([
			...highlightedSourceAttrs,
			...highlightedTargetAttrs,
			...selectedHighlightedAttrs,
		]);
		const allRelatedAttrs = showAllAttrs
			? attrs
			: attrs.filter((attr) => relatedAttrNames.has(attr.name));

		const maxAttrs = isExpanded
			? allRelatedAttrs.length
			: DEFAULT_VISIBLE_ATTRS;
		const visibleAttrs = allRelatedAttrs.slice(0, maxAttrs);
		const moreCount = allRelatedAttrs.length - visibleAttrs.length;

		const _isDataMart = upstreamCount > 0 && downstreamCount === 0;
		const _isSource = upstreamCount === 0 && downstreamCount > 0;

		const isSearchMatchHighlight = highlightType === "searchMatch";
		const borderColor =
			highlightType !== "none"
				? HIGHLIGHT_COLORS[highlightType as keyof typeof HIGHLIGHT_COLORS]
				: colors.border;
		// Search matches get a pulsing glow effect via different border width
		const borderWidth =
			highlightType !== "none" ? (isSearchMatchHighlight ? 3 : 3) : 2;

		// Dim non-matching nodes when search is active
		const shouldDim =
			isSearchActive && !isSearchMatch && highlightType === "none";
		const nodeOpacity = shouldDim ? 0.3 : 1;

		return (
			<div
				style={{
					background: "#fff",
					border: `${borderWidth}px solid ${borderColor}`,
					borderRadius: 8,
					width: 280,
					boxShadow:
						highlightType !== "none"
							? `0 4px 20px ${borderColor}40`
							: "0 2px 8px rgba(0,0,0,0.1)",
					overflow: "hidden",
					cursor: "pointer",
					opacity: nodeOpacity,
					transition: "all 0.2s ease",
				}}
				onClick={() => onNodeClick(id)}
				onDoubleClick={() => onNodeDoubleClick(id, graphId)}
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
								{entity.type}
								{/*{entity.modified && (*/}
								{/*	<span*/}
								{/*		style={{*/}
								{/*			marginLeft: 6,*/}
								{/*			background: "#ff9800",*/}
								{/*			color: "#fff",*/}
								{/*			padding: "1px 4px",*/}
								{/*			borderRadius: 3,*/}
								{/*			fontSize: 9,*/}
								{/*		}}*/}
								{/*	>*/}
								{/*		изм.*/}
								{/*	</span>*/}
								{/*)}*/}
								{/*{isDataMart && (*/}
								{/*	<span*/}
								{/*		style={{*/}
								{/*			marginLeft: 6,*/}
								{/*			background: "#9c27b0",*/}
								{/*			color: "#fff",*/}
								{/*			padding: "1px 4px",*/}
								{/*			borderRadius: 3,*/}
								{/*			fontSize: 9,*/}
								{/*		}}*/}
								{/*		title="Витрина данных"*/}
								{/*	>*/}
								{/*		витрина*/}
								{/*	</span>*/}
								{/*)}*/}
								{/*{isSource && (*/}
								{/*	<span*/}
								{/*		style={{*/}
								{/*			marginLeft: 6,*/}
								{/*			background: "#00897b",*/}
								{/*			color: "#fff",*/}
								{/*			padding: "1px 4px",*/}
								{/*			borderRadius: 3,*/}
								{/*			fontSize: 9,*/}
								{/*		}}*/}
								{/*		title="Источник данных"*/}
								{/*	>*/}
								{/*		источник*/}
								{/*	</span>*/}
								{/*)}*/}
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
					<div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 10 }}>
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
						{attrs.length > 0 && (
							<span style={{ color: "#888", marginLeft: "auto" }}>
								{visibleAttrs.length}/{attrs.length} атр.
							</span>
						)}
					</div>
				</div>

				{/* Related attributes */}
				{visibleAttrs.length > 0 && (
					<div onMouseLeave={() => onAttrHover(id, null)}>
						{visibleAttrs.map((attr, idx) => {
							const isSourceHighlighted = highlightedSourceAttrs.has(attr.name);
							const isTargetHighlighted = highlightedTargetAttrs.has(attr.name);
							const isHoverHighlighted = hoverHighlightedAttrs.has(attr.name);
							const isSelectedHighlighted = selectedHighlightedAttrs.has(
								attr.name,
							);
							const isHighlighted = isHoverHighlighted || isSelectedHighlighted;
							return (
								<div
									key={attr.name}
									onMouseEnter={() => onAttrHover(id, attr.name)}
									onClick={(e) => {
										e.stopPropagation();
										onAttrClick(id, attr.name);
									}}
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
											: isHoverHighlighted
												? `${HIGHLIGHT_COLORS.selected}30`
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
												isTargetHighlighted || isHighlighted
													? HIGHLIGHT_COLORS.selected
													: colors.border,
											width: isHighlighted ? 8 : 6,
											height: isHighlighted ? 8 : 6,
											left: -3,
											border: "1px solid #fff",
											transition: "all 0.15s ease",
										}}
									/>
									<span
										style={{
											color: isHighlighted ? "#333" : "#555",
											whiteSpace: "nowrap",
											overflow: "hidden",
											textOverflow: "ellipsis",
											flex: 1,
											fontWeight: isHighlighted ? 600 : 400,
										}}
									>
										{attr.name}
									</span>
									<span style={{ color: "#999", marginLeft: 8, fontSize: 9 }}>
										{attr.type}
									</span>
									{/* Source handle for this attribute */}
									<Handle
										type="source"
										position={Position.Right}
										id={`attr-source-${attr.name}`}
										style={{
											background:
												isSourceHighlighted || isHighlighted
													? HIGHLIGHT_COLORS.selected
													: colors.border,
											width: isHighlighted ? 8 : 6,
											height: isHighlighted ? 8 : 6,
											right: -3,
											border: "1px solid #fff",
											transition: "all 0.15s ease",
										}}
									/>
								</div>
							);
						})}
						{(moreCount > 0 || isExpanded) && (
							<div
								onClick={(e) => {
									e.stopPropagation();
									onExpandToggle?.(id, !isExpanded);
								}}
								style={{
									padding: "4px 10px",
									fontSize: 10,
									color: "#1976d2",
									background: "#f8f9fa",
									textAlign: "center",
									cursor: "pointer",
									fontWeight: 500,
									borderTop: "1px solid #e0e0e0",
								}}
								title={
									isExpanded
										? "Свернуть атрибуты"
										: `Показать все ${attrs.length} атрибутов`
								}
							>
								{isExpanded ? "▲ Свернуть" : `▼ Ещё ${moreCount} атрибутов...`}
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

EntityNodePreviewComponent.displayName = "EntityNodePreviewComponent";

export const graphNodeTypes = { entityNode: EntityNodePreviewComponent };
