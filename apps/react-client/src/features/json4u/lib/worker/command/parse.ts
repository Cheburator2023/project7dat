import type { Kind } from "@react-client/features/json4u/lib/editor/editor";
import { prettyFormat } from "@react-client/features/json4u/lib/format/pretty";
import type { Graph } from "@react-client/features/json4u/lib/graph/types";
import {
	type StringifyOptions,
	type TreeObject,
	parseJSON,
} from "@react-client/features/json4u/lib/parser";
import { getViewState } from "@react-client/features/json4u/lib/worker/stores/viewStore";
import { isEmpty } from "lodash-es";

export interface ParseAndFormatOptions extends StringifyOptions {
	kind: Kind;
}

export interface ParsedTree {
	treeObject: TreeObject;
	graph?: Graph;
	tableHTML?: string;
}

export async function parseAndFormat(
	text: string,
	options?: ParseAndFormatOptions,
): Promise<ParsedTree> {
	// 5MB costs 240ms
	const tree = parseJSON(text, options);

	if (options?.kind === "main") {
		getViewState().setTree(tree);
	}

	if (!tree.valid()) {
		if (options?.format) {
			tree.text = prettyFormat(text, options);
		}
		return { treeObject: tree.toObject() };
	}

	if (options?.format) {
		// 5MB costs 69ms
		tree.stringify(options);
	} else if (!isEmpty(tree.nestNodeMap)) {
		tree.stringifyNestNodes();
	}

	return { treeObject: tree.toObject() };
}
