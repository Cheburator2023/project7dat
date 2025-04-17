"use client";

import Background from "@react-client/features/json4u/components/Background";
import { px2num } from "@react-client/features/json4u/lib/utils";
import { useEffect, useRef } from "react";
import { type TimeoutIdMap, Tooltip, globalStyle, tableId } from "./Tooltip";
import { useOnClickExpander } from "./useOnClickExpander";
// import { useOnShowTooltip } from "./useOnShowTooltip";
import { useTableHTML } from "./useTableHTML";

// TODO: redesign
export function JsonTable() {
	const tableHTML = useTableHTML();
	const timeoutIdMap: TimeoutIdMap = useRef({});
	const onClickExpander = useOnClickExpander();
	// const { onMouseOver, onMouseOut } = useOnShowTooltip(timeoutIdMap);

	useEffect(() => {
		const { paddingBottom } = getComputedStyle(
			document.getElementById(tableId)!,
		);
		globalStyle.paddingBottom = px2num(paddingBottom);
	}, []);

	return (
		<div
			id={tableId}
			className="relative w-full h-full pb-header overflow-auto"
		>
			<div
				className="w-fit h-fit bg-white"
				onClick={onClickExpander}
				// onMouseOver={onMouseOver}
				// onMouseOut={onMouseOut}
				dangerouslySetInnerHTML={tableHTML}
			/>
			<Tooltip timeoutIdMap={timeoutIdMap} />
			<Background />
		</div>
	);
}
