import React, { memo, useMemo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import * as fuzzysort from "fuzzysort";
import type { EntityNodeData } from "../../dashboard/types";
import { TYPE_COLORS, HIGHLIGHT_COLORS } from "../../dashboard/constants";
import { useDashboardStore } from "../../dashboard/stores";

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

export const ModelNodePreviewComponent = memo(
	({ data, id }: NodeProps<EntityNode>) => {
		const {
			entity,
			highlightType,
			onNodeClick,
			onNodeDoubleClick,
			onViewDetails,
			onAttrClick,
			upstreamCount,
			downstreamCount,
			highlightedSourceAttrs = EMPTY_STRING_SET,
			highlightedTargetAttrs = EMPTY_STRING_SET,
			selectedHighlightedAttrs = EMPTY_STRING_SET,
			isSearchActive = false,
			isSearchMatch = false,
		} = data;
		const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.table;
		const attrs = entity.attrSeq || [];

		// Local search state
		const [localSearchQuery, setLocalSearchQuery] = useState("");

		// Get global attribute search from store with stable selector
		const globalAttributeSearchQuery = useDashboardStore(
			selectGlobalAttributeSearch,
		);

		// Use global search if available, otherwise local
		const activeSearchQuery = globalAttributeSearchQuery || localSearchQuery;

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

		// Fuzzy search for attributes using fuzzysort
		const searchedAttrs = useMemo(() => {
			if (!activeSearchQuery || activeSearchQuery.length < 2) {
				return null;
			}
			// Search in both name and type fields
			const results = fuzzysort.go(activeSearchQuery, attrs, {
				keys: ["name", "type"],
				threshold: -10000,
			});
			return new Set(results.map((r) => r.obj.name));
		}, [activeSearchQuery, attrs]);

		// Show attributes based on search. By default: hide all attributes until search is active.
		// If an attribute is selected (clicked), also show selected-related attrs to ensure
		// the connected node renders the mapped attribute and the edge can attach to attr handles.
		const visibleAttrs = useMemo(() => {
			// If search is active (3+ chars), show only search results with mappings
			if (searchedAttrs) {
				return attrs.filter(
					(attr) =>
						(searchedAttrs.has(attr.name) && relatedAttrNames.has(attr.name)) ||
						selectedHighlightedAttrs.has(attr.name),
				);
			}

			if (selectedHighlightedAttrs.size > 0) {
				return attrs.filter((attr) => selectedHighlightedAttrs.has(attr.name));
			}

			return [];
		}, [attrs, relatedAttrNames, searchedAttrs, selectedHighlightedAttrs]);

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

		const handleNavClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				console.log({entity})
				debugger
				if(entity.type === 'model'){

					const entityId =
						id.startsWith("__model_node__") ||
						id.startsWith("__model__fake_node__")
					 ? id : `__model__fake_node__${id}.${entity.namespace}`
					onNodeClick?.(entityId);
					return;
				}
				onNodeClick?.(id);
			},
			[id, onNodeClick],
		);

		const handleViewDetailsClick = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation();
				onViewDetails?.(id);
			},
			[id, onViewDetails],
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

		const detailsButtonStyle = useMemo(
			() => ({
				...NAV_BUTTON_BASE_STYLE,
				backgroundColor: "#d26019",
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
						{(data.entity.type as any) !== "model" && (
								<button
									onClick={handleViewDetailsClick}
									style={detailsButtonStyle}
									title="Открыть детали"
									type="button"
								>
									ⓘ
								</button>
						)}
								<button
									onClick={handleNavClick}
									style={navButtonStyle}
									title="Открыть страницу сущности"
									type="button"
								>
									↗
								</button>

					</div>
				</div>

				{/* {showAttrToggle && (
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
				)} */}

				{/* Search input for attributes */}
				{/*{!globalAttributeSearchQuery &&*/}
				{/*	(data.entity.type as any) !== "Model" && (*/}
				{/*		<div*/}
				{/*			className="nodrag nopan"*/}
				{/*			style={{*/}
				{/*				padding: "8px 12px",*/}
				{/*				borderBottom: "1px solid #e0e0e0",*/}
				{/*			}}*/}
				{/*			onPointerDown={handleStopPropagation}*/}
				{/*			onMouseDown={handleStopPropagation}*/}
				{/*		>*/}
				{/*			<input*/}
				{/*				type="text"*/}
				{/*				placeholder="Поиск атрибутов (мин. 2 символа)..."*/}
				{/*				value={localSearchQuery}*/}
				{/*				onChange={(e) => setLocalSearchQuery(e.target.value)}*/}
				{/*				onClick={handleStopPropagation}*/}
				{/*				style={{*/}
				{/*					width: "100%",*/}
				{/*					padding: "4px 8px",*/}
				{/*					fontSize: 10,*/}
				{/*					border: "1px solid #ddd",*/}
				{/*					borderRadius: 4,*/}
				{/*					outline: "none",*/}
				{/*				}}*/}
				{/*			/>*/}
				{/*		</div>*/}
				{/*	)}*/}

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

ModelNodePreviewComponent.displayName = "ModelNodePreviewComponent";

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
				position: "relative",
			}}
		>
			{data.label && (
				<div
					style={{
						position: "absolute",
						top: 8,
						left: 12,
						fontSize: 11,
						fontWeight: 600,
						color: "#666",
						pointerEvents: "none",
						userSelect: "none",
						letterSpacing: 0.3,
						textTransform: "uppercase",
					}}
				>
					{data.label}
				</div>
			)}
		</div>
	);
});

DepthGroupNode.displayName = "DepthGroupNode";

export const graphNodeTypes = {
	entityNode: ModelNodePreviewComponent,
	depthGroup: DepthGroupNode,
};
