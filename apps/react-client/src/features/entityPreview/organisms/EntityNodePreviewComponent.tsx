import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { EntityNodeData } from "../../dashboard/types";
import { TYPE_COLORS, HIGHLIGHT_COLORS } from "../../dashboard/constants";

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

const TOGGLE_STYLE = {
	padding: "6px 10px",
	fontSize: 10,
	color: "#1976d2",
	background: "#f8f9fa",
	textAlign: "center" as const,
	cursor: "pointer",
	fontWeight: 500,
	borderBottom: "1px solid #e0e0e0",
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

export const EntityNodePreviewComponent = memo(
	({ data, id }: NodeProps<EntityNode>) => {
		const {
			entity,
			highlightType,
			onNodeClick,
			onAttrClick,
			upstreamCount,
			downstreamCount,
			highlightedSourceAttrs = EMPTY_STRING_SET,
			highlightedTargetAttrs = EMPTY_STRING_SET,
			selectedHighlightedAttrs = EMPTY_STRING_SET,
			isSearchActive = false,
			isSearchMatch = false,
			entityCount = 0,
		} = data;
		const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.table;
		const attrs = entity.attrSeq || [];

		const [isExpanded, setIsExpanded] = useState(false);

		const shouldBeExpandedDefault = entityCount < 100;

		useEffect(() => {
			setIsExpanded(shouldBeExpandedDefault);
		}, [shouldBeExpandedDefault]);

		const handleToggleExpand = useCallback(() => {
			setIsExpanded((prev) => !prev);
		}, []);

		// Show all attributes when expanded, mark related ones visually
		const shouldComputeAttrs = isExpanded;
		const visibleAttrs = useMemo(() => {
			if (!shouldComputeAttrs) {
				return [];
			}
			return attrs;
		}, [attrs, shouldComputeAttrs]);

		const isSearchMatchHighlight = highlightType === "searchMatch";
		const borderColor =
			highlightType !== "none"
				? HIGHLIGHT_COLORS[highlightType as keyof typeof HIGHLIGHT_COLORS]
				: colors.border;
		const borderWidth =
			highlightType !== "none" ? (isSearchMatchHighlight ? 3 : 3) : 2;

		const shouldDim =
			isSearchActive && !isSearchMatch && highlightType === "none";
		const nodeOpacity = shouldDim ? 0.3 : 1;

		const hasAttrs = attrs.length > 0;
		const showAttrToggle = hasAttrs;

		const handleNavClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				onNodeClick?.(id);
			},
			[id, onNodeClick],
		);

		const handleAttrClickMemo = useCallback(
			(e: React.MouseEvent, attrName: string) => {
				e.stopPropagation();
				onAttrClick(id, attrName);
			},
			[id, onAttrClick],
		);

		const handleToggleClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				handleToggleExpand();
			},
			[handleToggleExpand],
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
			}),
			[borderWidth, borderColor, highlightType, nodeOpacity],
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

		const navButtonStyle = useMemo(
			() => ({
				...NAV_BUTTON_BASE_STYLE,
				marginLeft: attrs.length > 0 ? 8 : "auto",
			}),
			[attrs.length],
		);

		const toggleTitle = isExpanded
			? "Свернуть атрибуты"
			: `Показать ${attrs.length} атрибутов`;

		const toggleText = isExpanded
			? "▲ Свернуть атрибуты"
			: `▼ Атрибуты (${attrs.length})`;

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
			<div style={nodeContainerStyle}>
				{/* Header */}
				<div style={headerStyle}>
					<div style={HEADER_FLEX_STYLE}>
						<div style={HEADER_CONTENT_STYLE}>
							<div style={entityTypeStyle}>{entity.type}</div>
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
						<button
							onClick={handleNavClick}
							style={navButtonStyle}
							title="Открыть страницу сущности"
						>
							↗
						</button>
					</div>
				</div>

				{showAttrToggle && (
					<div
						className="nodrag nopan"
						data-name="shownAttrToggle_collapse"
						onPointerDown={handleStopPropagation}
						onMouseDown={handleStopPropagation}
						onClick={handleToggleClick}
						style={TOGGLE_STYLE}
						title={toggleTitle}
					>
						{toggleText}
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
							const isHighlighted = isSelectedHighlighted;
							return (
								<div
									key={attr.name}
									onClick={(e) => handleAttrClickMemo(e, attr.name)}
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
											...ATTR_NAME_STYLE,
											color: isHighlighted ? "#333" : "#555",
											fontWeight: isHighlighted ? 600 : 400,
										}}
									>
										{attr.name}
									</span>
									<span style={ATTR_TYPE_STYLE}>{attr.type}</span>
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

export const graphNodeTypes = { entityNode: EntityNodePreviewComponent };
