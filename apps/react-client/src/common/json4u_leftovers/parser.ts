import { rootMarker } from "./idgen";

export type SortType = "asc" | "desc";

export interface ParseOptions {
	nest?: boolean;
	format?: boolean | "minify";
	prettyMaxWidth?: number;
	tabWidth?: number;
	sort?: SortType;
}

export interface ContextError {
	offset: number;
	length: number;
	context: [string, string, string];
}

export type NodeType =
	| "object"
	| "array"
	| "string"
	| "number"
	| "boolean"
	| "null";

export interface Node {
	id: string;
	type: NodeType;
	offset: number;
	length: number;
	boundOffset: number;
	boundLength: number;
	value?: any;
	rawValue?: string;
	childrenKeys?: string[];
	childrenKey2Id?: Record<string, string>;
}

export function isRoot(node: Node) {
	return node.id === rootMarker;
}

export function isIterable(node: Node) {
	return node.type === "array" || node.type === "object";
}

export function hasChildren(node: Node | undefined) {
	return !!node?.childrenKeys?.length;
}

export function getChildrenKeys(node: Node): string[] {
	return node?.childrenKeys ?? [];
}

export function getChildId(node: Node, key: string): string | undefined {
	return node.childrenKey2Id?.[key];
}

export function getRawValue(node: Node): string | undefined {
	if (node.rawValue !== undefined) return node.rawValue;
	if (node.value !== undefined) return node.value;
	return undefined;
}

export function computeAndSetBoundLength(node: Node) {
	node.boundLength = node.offset + node.length - (node.boundOffset ?? 0);
}
