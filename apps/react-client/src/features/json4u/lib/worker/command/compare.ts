import * as compare from "@react-client/features/json4u/lib/compare";
import {
	Tree,
	type TreeObject,
} from "@react-client/features/json4u/lib/parser";

export { compareText } from "@react-client/features/json4u/lib/compare";

export function compareTree(ltreeObject: TreeObject, rtreeObject: TreeObject) {
	const ltree = Tree.fromObject(ltreeObject);
	const rtree = Tree.fromObject(rtreeObject);
	return compare.compareJSON(ltree, rtree);
}
