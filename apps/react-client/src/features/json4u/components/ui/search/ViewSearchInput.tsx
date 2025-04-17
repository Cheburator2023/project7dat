import { LeftTruncate } from "@react-client/features/json4u/components/ui/truncate";
import { genValueAttrs } from "@react-client/features/json4u/lib/graph/layout";
import { toPath } from "@react-client/features/json4u/lib/idgen";
import { hasChildren } from "@react-client/features/json4u/lib/parser";
import { cn } from "@react-client/features/json4u/lib/utils";
import type { SearchResult } from "@react-client/features/json4u/lib/worker/stores/types";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { getTree } from "@react-client/features/json4u/stores/treeStore";
import SearchInput from "./SearchInput";

export default function ViewSearchInput() {
	const setRevealPosition = useStatusStore((state) => state.setRevealPosition);

	return (
		<SearchInput
			id="view-search"
			openListOnFocus
			search={(input) => window.worker?.searchInView(input)}
			onSelect={(item) =>
				setRevealPosition({
					treeNodeId: item.id,
					type: item.revealType,
					from: "search",
				})
			}
			Item={Item}
			itemHeight={48}
			placeholder={"search_json"}
			bindShortcut="F"
		/>
	);
}

function Item(props: SearchResult) {
	const { revealType, id, label } = props;
	const node = getTree().node(id);

	if (!node) {
		return null;
	}

	const pathStr = ["$", ...toPath(id)].join(" > ");
	let className = "";

	if (revealType === "value") {
		const { className: cls } = genValueAttrs(node);
		className = cls;
	} else if (!hasChildren(node)) {
		className = "text-hl-key";
	}

	return (
		<div className="w-full h-12 flex flex-col justify-center">
			<div className={cn("text-sm truncate", className)}>{label}</div>
			<LeftTruncate className="text-xs text-muted-foreground" text={pathStr} />
		</div>
	);
}
