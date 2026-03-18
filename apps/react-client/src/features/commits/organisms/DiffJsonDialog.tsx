import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FC, ReactNode } from "react";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	InputAdornment,
	Tab,
	Tabs,
	TextField,
	Typography,
} from "@mui/material";
import {
	Close as CloseIcon,
	ExpandMore as ExpandMoreIcon,
	Search as SearchIcon,
} from "@mui/icons-material";
import { create as createDiff } from "jsondiffpatch";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import { go as fuzzyGo, single as fuzzySingle } from "fuzzysort";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useCurrentDataLineageWholeData } from "@react-client/api/hooks/useCurrentDataLineageSnapshot";
import { useS2tCommitById } from "@react-client/api/hooks/useS2tCommitById";
import { formatDiffPathForDisplay } from "../diffWorker";
import { DiffChangeRow } from "./DiffChangeRow";

const MonacoDiffEditor = lazy(() =>
	import("@monaco-editor/react").then((m) => ({ default: m.DiffEditor })),
);

const diffInstance = createDiff();
const DIFF_DEBOUNCE_MS = 220;
const SEARCH_DEBOUNCE_MS = 260;
const LINE_DIFF_MAX_LENGTH = 4_000_000;
const SEARCH_MIN_LENGTH = 3;
const LARGE_JSON_NODE_THRESHOLD = 120000;
const MAX_CHANGES_IN_OUTPUT = 20000;

interface DiffChangeItem {
	path: string;
	type: "added" | "modified";
	entityKey: string;
	entityLabel: string;
	searchText: string;
	before?: unknown;
	after?: unknown;
}

interface DiffSummary {
	added: number;
	modified: number;
	skippedDeletions: number;
}

interface DiffComputationResult {
	summary: DiffSummary;
	changes: DiffChangeItem[];
	truncated: boolean;
}

interface DiffEntityGroup {
	entityKey: string;
	entityLabel: string;
	added: number;
	modified: number;
	changes: DiffChangeItem[];
	searchText: string;
}

interface SearchHighlightMatch {
	indexes: number[];
}

const buildEntityGroups = (changes: DiffChangeItem[]): DiffEntityGroup[] => {
	const groupMap = new Map<string, DiffEntityGroup>();

	for (const change of changes) {
		const existing = groupMap.get(change.entityKey);
		if (existing) {
			existing.changes.push(change);
			existing.searchText = `${existing.searchText} ${change.searchText}`;
			if (change.type === "added") {
				existing.added += 1;
			} else {
				existing.modified += 1;
			}
			continue;
		}

		groupMap.set(change.entityKey, {
			entityKey: change.entityKey,
			entityLabel: change.entityLabel,
			added: change.type === "added" ? 1 : 0,
			modified: change.type === "modified" ? 1 : 0,
			changes: [change],
			searchText: `${change.entityLabel} ${change.searchText}`,
		});
	}

	return Array.from(groupMap.values()).sort((a, b) => {
		const diff = b.changes.length - a.changes.length;
		if (diff !== 0) return diff;
		return a.entityLabel.localeCompare(b.entityLabel, "ru");
	});
};

const renderHighlightedText = (text: string, query: string): ReactNode => {
	if (!query.trim()) {
		return text;
	}

	const result = fuzzySingle(query, text);
	if (
		!result ||
		!Array.isArray(result.indexes) ||
		result.indexes.length === 0
	) {
		return text;
	}

	const indexes = [...result.indexes].sort((a, b) => a - b);
	const highlightedIndexSet = new Set(indexes);
	const nodes: ReactNode[] = [];
	let segmentStart = 0;
	let segmentMode: "plain" | "mark" = highlightedIndexSet.has(0)
		? "mark"
		: "plain";

	for (let i = 1; i <= text.length; i += 1) {
		const mode: "plain" | "mark" = highlightedIndexSet.has(i)
			? "mark"
			: "plain";
		if (i === text.length || mode !== segmentMode) {
			const piece = text.slice(segmentStart, i);
			if (piece) {
				nodes.push(
					segmentMode === "mark" ? (
						<mark key={`${segmentStart}-${i}`}>{piece}</mark>
					) : (
						piece
					),
				);
			}
			segmentStart = i;
			segmentMode = mode;
		}
	}

	return <>{nodes}</>;
};

const renderHighlightedTextByIndexes = (
	text: string,
	indexes: number[] | undefined,
): ReactNode => {
	if (!indexes || indexes.length === 0) {
		return text;
	}

	const sortedIndexes = [...indexes].sort((a, b) => a - b);
	const highlightedIndexSet = new Set(sortedIndexes);
	const nodes: ReactNode[] = [];
	let segmentStart = 0;
	let segmentMode: "plain" | "mark" = highlightedIndexSet.has(0)
		? "mark"
		: "plain";

	for (let i = 1; i <= text.length; i += 1) {
		const mode: "plain" | "mark" = highlightedIndexSet.has(i)
			? "mark"
			: "plain";
		if (i === text.length || mode !== segmentMode) {
			const piece = text.slice(segmentStart, i);
			if (piece) {
				nodes.push(
					segmentMode === "mark" ? (
						<mark key={`${segmentStart}-${i}`}>{piece}</mark>
					) : (
						piece
					),
				);
			}
			segmentStart = i;
			segmentMode = mode;
		}
	}

	return <>{nodes}</>;
};

const toPreview = (value: unknown): string => {
	return JSON.stringify(value);
};

const formatStableKeyLabel = (stableKey: string): string => {
	const [base, ...rest] = stableKey.split("::sys:");
	const sys = rest.length > 0 ? rest.join("::sys:") : "";
	const sysPart = sys ? " (система: " + sys + ")" : "";

	if (base.startsWith("id:")) {
		return "ID: " + base.slice(3) + sysPart;
	}
	if (base.startsWith("entityId:")) {
		return "entityId: " + base.slice(9) + sysPart;
	}
	if (base.startsWith("name:")) {
		return "название: " + base.slice(5) + sysPart;
	}
	if (base.startsWith("src:") && base.includes("::dst:")) {
		const [srcPart, dstPart] = base.split("::dst:");
		return "источник: " + srcPart.slice(4) + " → " + dstPart + sysPart;
	}
	return base + sysPart;
};

const getEntityMetaFromPath = (
	path: string,
): { entityKey: string; entityLabel: string } => {
	if (!path) {
		return { entityKey: "<root>", entityLabel: "<root>" };
	}

	const parts = path.split(".");
	if (parts.length > 1 && /^\d+$/.test(parts[1])) {
		return {
			entityKey: `${parts[0]}.${parts[1]}`,
			entityLabel: `${parts[0]}[${parts[1]}]`,
		};
	}

	if (parts.length > 1 && parts[1].startsWith("id:")) {
		const rawKey = parts[1].slice(3);
		try {
			const decodedKey = decodeURIComponent(rawKey);
			const prettyKey = formatStableKeyLabel(decodedKey);
			return {
				entityKey: `${parts[0]}.${parts[1]}`,
				entityLabel: `${parts[0]} — ${prettyKey}`,
			};
		} catch {
			return {
				entityKey: `${parts[0]}.${parts[1]}`,
				entityLabel: `${parts[0]} — ${rawKey}`,
			};
		}
	}

	return {
		entityKey: parts[0],
		entityLabel: parts[0],
	};
};

const getStableArrayItemKey = (item: unknown): string | null => {
	if (!item || typeof item !== "object" || Array.isArray(item)) {
		return null;
	}

	const obj = item as Record<string, unknown>;
	const idValue = obj.id;
	const entityIdValue = obj.entityId;
	const systemCodeValue = obj.system_code;
	const nameValue = obj.name;
	const srcValue = obj.src;
	const dstValue = obj.dst;

	const systemCode =
		typeof systemCodeValue === "string" && systemCodeValue.trim().length > 0
			? systemCodeValue.trim()
			: "";

	if (typeof idValue === "string" || typeof idValue === "number") {
		const id = String(idValue);
		return systemCode ? `id:${id}::sys:${systemCode}` : `id:${id}`;
	}

	if (typeof entityIdValue === "string" || typeof entityIdValue === "number") {
		const entityId = String(entityIdValue);
		return systemCode
			? `entityId:${entityId}::sys:${systemCode}`
			: `entityId:${entityId}`;
	}

	if (typeof nameValue === "string" && nameValue.trim().length > 0) {
		return `name:${nameValue.trim()}`;
	}

	if (
		(typeof srcValue === "string" || typeof srcValue === "number") &&
		(typeof dstValue === "string" || typeof dstValue === "number")
	) {
		return `src:${String(srcValue)}::dst:${String(dstValue)}`;
	}

	return null;
};

const tryMatchArrayByStableKey = (
	path: string,
	leftItems: unknown[],
	rightItems: unknown[],
	pending: Array<{ path: string; left: unknown; right: unknown }>,
	pushChange: (
		type: "added" | "modified",
		childPath: string,
		before: unknown,
		after: unknown,
	) => void,
	onSkippedDeletion: () => void,
): boolean => {
	const leftEntries = leftItems.map((item) => ({
		item,
		stableKey: getStableArrayItemKey(item),
	}));
	const rightEntries = rightItems.map((item) => ({
		item,
		stableKey: getStableArrayItemKey(item),
	}));

	if (
		leftEntries.some((entry) => entry.stableKey === null) ||
		rightEntries.some((entry) => entry.stableKey === null)
	) {
		return false;
	}

	const leftMap = new Map<string, unknown[]>();
	const rightMap = new Map<string, unknown[]>();

	for (const entry of leftEntries) {
		const key = entry.stableKey as string;
		const existing = leftMap.get(key);
		if (existing) {
			existing.push(entry.item);
		} else {
			leftMap.set(key, [entry.item]);
		}
	}

	for (const entry of rightEntries) {
		const key = entry.stableKey as string;
		const existing = rightMap.get(key);
		if (existing) {
			existing.push(entry.item);
		} else {
			rightMap.set(key, [entry.item]);
		}
	}

	const keySet = new Set([...leftMap.keys(), ...rightMap.keys()]);
	for (const stableKey of Array.from(keySet).reverse()) {
		const leftBucket = leftMap.get(stableKey) ?? [];
		const rightBucket = rightMap.get(stableKey) ?? [];
		const maxLength = Math.max(leftBucket.length, rightBucket.length);

		for (let index = maxLength - 1; index >= 0; index -= 1) {
			const childPath = toPath(path, `id:${encodeURIComponent(stableKey)}`);
			if (index >= leftBucket.length) {
				pushChange("added", childPath, undefined, rightBucket[index]);
				continue;
			}
			if (index >= rightBucket.length) {
				onSkippedDeletion();
				continue;
			}
			pending.push({
				path: childPath,
				left: leftBucket[index],
				right: rightBucket[index],
			});
		}
	}

	return true;
};

const createDiffChange = (
	type: "added" | "modified",
	path: string,
	before: unknown,
	after: unknown,
): DiffChangeItem => {
	const { entityKey, entityLabel } = getEntityMetaFromPath(path);
	return {
		type,
		path,
		before,
		after,
		entityKey,
		entityLabel,
		searchText: `${entityLabel} ${path} ${toPreview(before)} ${toPreview(after)}`,
	};
};

const estimateComplexity = (left: unknown, right: unknown): number => {
	const stack: unknown[] = [left, right];
	const visited = new WeakSet<object>();
	let score = 0;

	while (stack.length > 0 && score < LARGE_JSON_NODE_THRESHOLD + 1) {
		const node = stack.pop();
		score += 1;

		if (!node || typeof node !== "object") {
			continue;
		}

		if (visited.has(node)) {
			continue;
		}
		visited.add(node);

		if (Array.isArray(node)) {
			for (let i = 0; i < node.length; i += 1) {
				stack.push(node[i]);
			}
			continue;
		}

		const entries = Object.values(node);
		for (let i = 0; i < entries.length; i += 1) {
			stack.push(entries[i]);
		}
	}

	return score;
};

const isPrimitive = (value: unknown): boolean => {
	return value === null || typeof value !== "object";
};

const toPath = (base: string, key: string | number): string => {
	return base === "" ? String(key) : `${base}.${String(key)}`;
};

const runChunkedMainThreadDiff = async (
	left: Record<string, unknown>,
	right: Record<string, unknown>,
	setProgressText: (value: string) => void,
): Promise<DiffComputationResult> => {
	if (diffInstance.diff(left, right) == null) {
		return {
			summary: { added: 0, modified: 0, skippedDeletions: 0 },
			changes: [],
			truncated: false,
		};
	}

	return await new Promise<DiffComputationResult>((resolve) => {
		const pending: Array<{
			path: string;
			left: unknown;
			right: unknown;
		}> = [{ path: "", left, right }];
		const visitedPairs = new WeakMap<object, WeakSet<object>>();
		const summary: DiffSummary = { added: 0, modified: 0, skippedDeletions: 0 };
		const changes: DiffChangeItem[] = [];
		let processed = 0;
		let totalOutputChanges = 0;

		const markVisited = (a: unknown, b: unknown): boolean => {
			if (!a || typeof a !== "object" || !b || typeof b !== "object") {
				return false;
			}
			let rightSet = visitedPairs.get(a);
			if (!rightSet) {
				rightSet = new WeakSet<object>();
				visitedPairs.set(a, rightSet);
			}
			if (rightSet.has(b)) {
				return true;
			}
			rightSet.add(b);
			return false;
		};

		const pushChange = (
			type: "added" | "modified",
			path: string,
			before: unknown,
			after: unknown,
		) => {
			summary[type] += 1;
			totalOutputChanges += 1;
			if (changes.length < MAX_CHANGES_IN_OUTPUT) {
				changes.push(createDiffChange(type, path, before, after));
			}
		};

		const runStep = () => {
			let steps = 0;
			while (pending.length > 0 && steps < 900) {
				steps += 1;
				processed += 1;

				const item = pending.pop();
				if (!item) continue;

				const { path, left: currentLeft, right: currentRight } = item;
				if (currentLeft === currentRight) continue;

				const leftPrimitive = isPrimitive(currentLeft);
				const rightPrimitive = isPrimitive(currentRight);
				if (leftPrimitive || rightPrimitive) {
					if (currentLeft === undefined && currentRight !== undefined) {
						pushChange("added", path, undefined, currentRight);
					} else if (currentRight === undefined && currentLeft !== undefined) {
						summary.skippedDeletions += 1;
					} else {
						pushChange("modified", path, currentLeft, currentRight);
					}
					continue;
				}

				if (markVisited(currentLeft, currentRight)) {
					continue;
				}

				const leftIsArray = Array.isArray(currentLeft);
				const rightIsArray = Array.isArray(currentRight);
				if (leftIsArray !== rightIsArray) {
					pushChange("modified", path, currentLeft, currentRight);
					continue;
				}

				if (leftIsArray && rightIsArray) {
					const matchedByStableKey = tryMatchArrayByStableKey(
						path,
						currentLeft,
						currentRight,
						pending,
						pushChange,
						() => {
							summary.skippedDeletions += 1;
						},
					);
					if (matchedByStableKey) {
						continue;
					}

					const maxLength = Math.max(currentLeft.length, currentRight.length);
					for (let index = maxLength - 1; index >= 0; index -= 1) {
						const childPath = toPath(path, index);
						if (index >= currentLeft.length) {
							pushChange("added", childPath, undefined, currentRight[index]);
							continue;
						}
						if (index >= currentRight.length) {
							summary.skippedDeletions += 1;
							continue;
						}
						pending.push({
							path: childPath,
							left: currentLeft[index],
							right: currentRight[index],
						});
					}
					continue;
				}

				const leftKeys = Object.keys(currentLeft as Record<string, unknown>);
				const rightKeys = Object.keys(currentRight as Record<string, unknown>);
				const keySet = new Set([...leftKeys, ...rightKeys]);

				for (const key of Array.from(keySet).reverse()) {
					const leftObj = currentLeft as Record<string, unknown>;
					const rightObj = currentRight as Record<string, unknown>;
					const hasLeft = Object.hasOwn(leftObj, key);
					const hasRight = Object.hasOwn(rightObj, key);
					const childPath = toPath(path, key);

					if (!hasLeft && hasRight) {
						pushChange("added", childPath, undefined, rightObj[key]);
						continue;
					}

					if (hasLeft && !hasRight) {
						summary.skippedDeletions += 1;
						continue;
					}

					pending.push({
						path: childPath,
						left: leftObj[key],
						right: rightObj[key],
					});
				}
			}

			if (pending.length > 0) {
				setProgressText(`Обрабатываем изменения… ${processed} узлов`);
				window.setTimeout(runStep, 0);
				return;
			}

			resolve({
				summary,
				changes,
				truncated: totalOutputChanges > MAX_CHANGES_IN_OUTPUT,
			});
		};

		runStep();
	});
};

const createWorkerScript = (): string => {
	return `
const MAX_CHANGES = ${MAX_CHANGES_IN_OUTPUT};

const isPrimitive = (value) => value === null || typeof value !== "object";

const toPath = (base, key) => {
	return base === "" ? String(key) : base + "." + String(key);
};

const getStableArrayItemKey = (item) => {
	if (!item || typeof item !== "object" || Array.isArray(item)) {
		return null;
	}

	const idValue = item.id;
	const entityIdValue = item.entityId;
	const systemCodeValue = item.system_code;
	const nameValue = item.name;
	const srcValue = item.src;
	const dstValue = item.dst;

	const systemCode =
		typeof systemCodeValue === "string" && systemCodeValue.trim().length > 0
			? systemCodeValue.trim()
			: "";

	if (typeof idValue === "string" || typeof idValue === "number") {
		const id = String(idValue);
		return systemCode ? "id:" + id + "::sys:" + systemCode : "id:" + id;
	}

	if (typeof entityIdValue === "string" || typeof entityIdValue === "number") {
		const entityId = String(entityIdValue);
		return systemCode
			? "entityId:" + entityId + "::sys:" + systemCode
			: "entityId:" + entityId;
	}

	if (typeof nameValue === "string" && nameValue.trim().length > 0) {
		return "name:" + nameValue.trim();
	}

	if (
		(typeof srcValue === "string" || typeof srcValue === "number") &&
		(typeof dstValue === "string" || typeof dstValue === "number")
	) {
		return "src:" + String(srcValue) + "::dst:" + String(dstValue);
	}

	return null;
};

const tryMatchArrayByStableKey = (
	path,
	leftItems,
	rightItems,
	pending,
	pushChange,
	onSkippedDeletion,
) => {
	const leftEntries = leftItems.map((item) => ({
		item,
		stableKey: getStableArrayItemKey(item),
	}));
	const rightEntries = rightItems.map((item) => ({
		item,
		stableKey: getStableArrayItemKey(item),
	}));

	if (
		leftEntries.some((entry) => entry.stableKey === null) ||
		rightEntries.some((entry) => entry.stableKey === null)
	) {
		return false;
	}

	const leftMap = new Map();
	const rightMap = new Map();

	for (const entry of leftEntries) {
		const key = entry.stableKey;
		const existing = leftMap.get(key);
		if (existing) {
			existing.push(entry.item);
		} else {
			leftMap.set(key, [entry.item]);
		}
	}

	for (const entry of rightEntries) {
		const key = entry.stableKey;
		const existing = rightMap.get(key);
		if (existing) {
			existing.push(entry.item);
		} else {
			rightMap.set(key, [entry.item]);
		}
	}

	const keySet = new Set([...leftMap.keys(), ...rightMap.keys()]);
	for (const stableKey of Array.from(keySet).reverse()) {
		const leftBucket = leftMap.get(stableKey) || [];
		const rightBucket = rightMap.get(stableKey) || [];
		const maxLength = Math.max(leftBucket.length, rightBucket.length);

		for (let index = maxLength - 1; index >= 0; index -= 1) {
			const childPath = toPath(path, "id:" + encodeURIComponent(stableKey));
			if (index >= leftBucket.length) {
				pushChange("added", childPath, undefined, rightBucket[index]);
				continue;
			}
			if (index >= rightBucket.length) {
				onSkippedDeletion();
				continue;
			}
			pending.push({
				path: childPath,
				left: leftBucket[index],
				right: rightBucket[index],
			});
		}
	}

	return true;
};

const toPreview = (value) => {
	if (value === undefined) return "undefined";
	if (value === null) return "null";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	try { return JSON.stringify(value, null, 2); } catch { return String(value); }
};

const formatStableKeyLabel = (stableKey) => {
	const sepIdx = stableKey.indexOf("::sys:");
	const base = sepIdx >= 0 ? stableKey.slice(0, sepIdx) : stableKey;
	const sys = sepIdx >= 0 ? stableKey.slice(sepIdx + 6) : "";
	const sysPart = sys ? " (система: " + sys + ")" : "";
	if (base.startsWith("id:")) return "ID: " + base.slice(3) + sysPart;
	if (base.startsWith("entityId:")) return "entityId: " + base.slice(9) + sysPart;
	if (base.startsWith("name:")) return "название: " + base.slice(5) + sysPart;
	if (base.startsWith("src:") && base.indexOf("::dst:") >= 0) {
		const dstIdx = base.indexOf("::dst:");
		return "источник: " + base.slice(4, dstIdx) + " → " + base.slice(dstIdx + 6) + sysPart;
	}
	return base + sysPart;
};

const getEntityMetaFromPath = (path) => {
	if (!path) {
		return { entityKey: "<root>", entityLabel: "<root>" };
	}
	const parts = path.split(".");
	if (parts.length > 1 && /^\\d+$/.test(parts[1])) {
		return {
			entityKey: parts[0] + "." + parts[1],
			entityLabel: parts[0] + "[" + parts[1] + "]",
		};
	}
	if (parts.length > 1 && parts[1].startsWith("id:")) {
		const rawKey = parts[1].slice(3);
		try {
			const decodedKey = decodeURIComponent(rawKey);
			const prettyKey = formatStableKeyLabel(decodedKey);
			return {
				entityKey: parts[0] + "." + parts[1],
				entityLabel: parts[0] + " — " + prettyKey,
			};
		} catch {
			return {
				entityKey: parts[0] + "." + parts[1],
				entityLabel: parts[0] + " — " + rawKey,
			};
		}
	}
	return { entityKey: parts[0], entityLabel: parts[0] };
};

const createDiffChange = (type, path, before, after) => {
	const meta = getEntityMetaFromPath(path);
	return {
		type,
		path,
		before,
		after,
		entityKey: meta.entityKey,
		entityLabel: meta.entityLabel,
		searchText:
			meta.entityLabel + " " + path + " " + toPreview(before) + " " + toPreview(after),
	};
};

self.onmessage = (event) => {
	try {
		const { left, right } = event.data;
		const pending = [{ path: "", left, right }];
		const visitedPairs = new WeakMap();
		const summary = { added: 0, modified: 0, skippedDeletions: 0 };
		const changes = [];
		let processed = 0;
		let totalOutputChanges = 0;

		const markVisited = (a, b) => {
			if (!a || typeof a !== "object" || !b || typeof b !== "object") {
				return false;
			}
			let rightSet = visitedPairs.get(a);
			if (!rightSet) {
				rightSet = new WeakSet();
				visitedPairs.set(a, rightSet);
			}
			if (rightSet.has(b)) {
				return true;
			}
			rightSet.add(b);
			return false;
		};

		const pushChange = (type, path, before, after) => {
			summary[type] += 1;
			totalOutputChanges += 1;
			if (changes.length < MAX_CHANGES) {
				changes.push(createDiffChange(type, path, before, after));
			}
		};

		const runStep = () => {
			let steps = 0;
			while (pending.length > 0 && steps < 800) {
				steps += 1;
				processed += 1;

				const item = pending.pop();
				if (!item) {
					continue;
				}

				const { path, left: currentLeft, right: currentRight } = item;

				if (currentLeft === currentRight) {
					continue;
				}

				const leftPrimitive = isPrimitive(currentLeft);
				const rightPrimitive = isPrimitive(currentRight);

				if (leftPrimitive || rightPrimitive) {
					if (currentLeft === undefined && currentRight !== undefined) {
						pushChange("added", path, undefined, currentRight);
					} else if (currentRight === undefined && currentLeft !== undefined) {
						summary.skippedDeletions += 1;
					} else {
						pushChange("modified", path, currentLeft, currentRight);
					}
					continue;
				}

				if (markVisited(currentLeft, currentRight)) {
					continue;
				}

				const leftIsArray = Array.isArray(currentLeft);
				const rightIsArray = Array.isArray(currentRight);
				if (leftIsArray !== rightIsArray) {
					pushChange("modified", path, currentLeft, currentRight);
					continue;
				}

				if (leftIsArray && rightIsArray) {
					const matchedByStableKey = tryMatchArrayByStableKey(
						path,
						currentLeft,
						currentRight,
						pending,
						pushChange,
						() => {
							summary.skippedDeletions += 1;
						},
					);
					if (matchedByStableKey) {
						continue;
					}

					const maxLength = Math.max(currentLeft.length, currentRight.length);
					for (let index = maxLength - 1; index >= 0; index -= 1) {
						const childPath = toPath(path, index);
						if (index >= currentLeft.length) {
							pushChange("added", childPath, undefined, currentRight[index]);
							continue;
						}
						if (index >= currentRight.length) {
							summary.skippedDeletions += 1;
							continue;
						}
						pending.push({
							path: childPath,
							left: currentLeft[index],
							right: currentRight[index],
						});
					}
					continue;
				}

				const leftKeys = Object.keys(currentLeft);
				const rightKeys = Object.keys(currentRight);
				const keySet = new Set([...leftKeys, ...rightKeys]);

				for (const key of Array.from(keySet).reverse()) {
					const hasLeft = Object.prototype.hasOwnProperty.call(currentLeft, key);
					const hasRight = Object.prototype.hasOwnProperty.call(currentRight, key);
					const childPath = toPath(path, key);

					if (!hasLeft && hasRight) {
						pushChange("added", childPath, undefined, currentRight[key]);
						continue;
					}

					if (hasLeft && !hasRight) {
						summary.skippedDeletions += 1;
						continue;
					}

					pending.push({
						path: childPath,
						left: currentLeft[key],
						right: currentRight[key],
					});
				}
			}

			if (pending.length > 0) {
				self.postMessage({ type: "progress", processed, pending: pending.length });
				setTimeout(runStep, 0);
				return;
			}

			self.postMessage({
				type: "done",
				processed,
				summary,
				changes,
				truncated: totalOutputChanges > MAX_CHANGES,
			});
		};

		runStep();
	} catch (error) {
		self.postMessage({
			type: "error",
			message: error && error.message ? error.message : "Worker diff failed",
		});
	}
};
`;
};

interface DiffJsonDialogProps {
	open: boolean;
	commit: S2tCommitItem | null;
	onClose: () => void;
}

export const DiffJsonDialog: FC<DiffJsonDialogProps> = ({
	open,
	commit,
	onClose,
}) => {
	const {
		data: snapshotData,
		isLoading,
		isFetching,
		isPending,
	} = useCurrentDataLineageWholeData({
		enabled: open,
	});

	const {
		data: fullCommit,
		isLoading: isCommitLoading,
		isFetching: isCommitFetching,
		error: commitFetchError,
	} = useS2tCommitById(commit?.id ?? null, { enabled: open && !!commit });

	const commitPayload = useMemo<Record<string, unknown> | null>(
		() => (fullCommit?.payload as Record<string, unknown> | undefined) ?? null,
		[fullCommit],
	);

	const [diffResult, setDiffResult] = useState<DiffComputationResult | null>(
		null,
	);
	const [isComputing, setIsComputing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [localSearchQuery, setLocalSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [expandedEntityKeys, setExpandedEntityKeys] = useState<string[]>([]);
	const [diffMode, setDiffMode] = useState<"structured" | "line">("structured");
	const [progressText, setProgressText] = useState(
		"Считаем различия к актуальным данным...",
	);
	const workerRef = useRef<Worker | null>(null);
	const workerUrlRef = useRef<string | null>(null);

	const isSnapshotLoading =
		open && (isLoading || isPending || (isFetching && !snapshotData));
	const isCommitPayloadLoading =
		open && !!commit && (isCommitLoading || (isCommitFetching && !fullCommit));
	const isDataLoading = isSnapshotLoading || isCommitPayloadLoading;

	const baselineData = useMemo(
		() => (snapshotData as Record<string, unknown> | null | undefined) ?? null,
		[snapshotData],
	);
	const [baselineJsonText, setBaselineJsonText] = useState("");
	const [commitJsonText, setCommitJsonText] = useState("");
	const [isPreparingText, setIsPreparingText] = useState(false);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setDebouncedSearchQuery(localSearchQuery.trim());
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			window.clearTimeout(timer);
		};
	}, [localSearchQuery]);

	const entityGroups = useMemo(() => {
		if (!diffResult) {
			return [];
		}

		return buildEntityGroups(diffResult.changes);
	}, [diffResult]);

	const activeSearchQuery = useMemo(
		() => debouncedSearchQuery.trim(),
		[debouncedSearchQuery],
	);

	const isSearchTooShort =
		activeSearchQuery.length > 0 &&
		activeSearchQuery.length < SEARCH_MIN_LENGTH;
	const isSearchActive = activeSearchQuery.length >= SEARCH_MIN_LENGTH;

	const searchState = useMemo(() => {
		const emptyState = {
			filteredGroups: entityGroups,
			groupLabelMatchMap: new Map<string, SearchHighlightMatch>(),
			changePathMatchMap: new Map<string, SearchHighlightMatch>(),
		};

		if (!isSearchActive || !diffResult) {
			return emptyState;
		}

		const changeResults = [
			...fuzzyGo(activeSearchQuery, diffResult.changes, {
				keys: ["entityLabel", "path", "searchText"],
				threshold: -10000,
				limit: diffResult.changes.length,
			}),
		] as unknown as Array<{
			obj: DiffChangeItem;
			indexes?: readonly number[];
			score?: number;
		}>;

		if (changeResults.length === 0) {
			return {
				filteredGroups: [],
				groupLabelMatchMap: new Map<string, SearchHighlightMatch>(),
				changePathMatchMap: new Map<string, SearchHighlightMatch>(),
			};
		}

		const matchedChanges: DiffChangeItem[] = [];
		const groupLabelMatchMap = new Map<string, SearchHighlightMatch>();
		const changePathMatchMap = new Map<string, SearchHighlightMatch>();

		for (const result of changeResults) {
			const change = result.obj;
			matchedChanges.push(change);

			const changeKey = `${change.type}:${change.path}`;
			const displayPath = formatDiffPathForDisplay(change.path);
			const pathMatch = fuzzySingle(activeSearchQuery, displayPath);
			if (pathMatch?.indexes?.length) {
				changePathMatchMap.set(changeKey, {
					indexes: [...pathMatch.indexes],
				});
			}

			if (!groupLabelMatchMap.has(change.entityKey)) {
				const labelMatch = fuzzySingle(activeSearchQuery, change.entityLabel);
				if (labelMatch?.indexes?.length) {
					groupLabelMatchMap.set(change.entityKey, {
						indexes: [...labelMatch.indexes],
					});
				}
			}
		}

		return {
			filteredGroups: buildEntityGroups(matchedChanges),
			groupLabelMatchMap,
			changePathMatchMap,
		};
	}, [entityGroups, isSearchActive, diffResult, activeSearchQuery]);

	const filteredGroups = searchState.filteredGroups;

	const filteredEntityKeys = useMemo(() => {
		return filteredGroups.map((group) => group.entityKey);
	}, [filteredGroups]);

	const firstMatchedChangeKey = useMemo(() => {
		const firstGroup = filteredGroups[0];
		const firstChange = firstGroup?.changes[0];
		if (!firstChange) {
			return null;
		}

		return `${firstChange.type}:${firstChange.path}`;
	}, [filteredGroups]);

	useEffect(() => {
		if (filteredGroups.length === 0) {
			setExpandedEntityKeys([]);
			return;
		}
		setExpandedEntityKeys((previous) => {
			if (previous.length > 0) {
				return previous.filter((key) =>
					filteredGroups.some((group) => group.entityKey === key),
				);
			}
			return filteredGroups.slice(0, 4).map((group) => group.entityKey);
		});
	}, [filteredGroups]);

	useEffect(() => {
		if (!isSearchActive || !firstMatchedChangeKey) {
			return;
		}

		const timer = window.setTimeout(() => {
			const target = document.getElementById(
				`diff-search-result-${encodeURIComponent(firstMatchedChangeKey)}`,
			);
			target?.scrollIntoView({
				block: "center",
				behavior: "smooth",
			});
		}, 0);

		return () => {
			window.clearTimeout(timer);
		};
	}, [isSearchActive, firstMatchedChangeKey]);

	useEffect(() => {
		if (!open || !commit) {
			setDiffResult(null);
			setError(null);
			setIsComputing(false);
			setLocalSearchQuery("");
			setDebouncedSearchQuery("");
			setExpandedEntityKeys([]);
			setDiffMode("structured");
			setProgressText("Считаем различия к актуальным данным...");
			setBaselineJsonText("");
			setCommitJsonText("");
			setIsPreparingText(false);

			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
			if (workerUrlRef.current) {
				URL.revokeObjectURL(workerUrlRef.current);
				workerUrlRef.current = null;
			}
			return;
		}

		if (!baselineData || !commitPayload) {
			return;
		}

		setIsComputing(true);
		setError(null);
		setDiffResult(null);
		setProgressText("Готовим расчет различий...");

		let cancelled = false;
		const timer = window.setTimeout(async () => {
			if (cancelled) return;

			try {
				const original = baselineData;
				const payload = commitPayload;
				const complexity = estimateComplexity(original, payload);

				if (complexity < LARGE_JSON_NODE_THRESHOLD) {
					const smallDiff = await runChunkedMainThreadDiff(
						original,
						payload,
						setProgressText,
					);
					if (!cancelled) {
						setDiffResult(smallDiff);
					}
					return;
				}

				setProgressText("Large JSON: запускаем различия в Web Worker…");
				if (typeof Worker === "undefined") {
					const fallback = await runChunkedMainThreadDiff(
						original,
						payload,
						setProgressText,
					);
					if (!cancelled) {
						setDiffResult(fallback);
					}
					return;
				}

				const workerScript = createWorkerScript();
				const workerBlob = new Blob([workerScript], {
					type: "application/javascript",
				});
				const workerUrl = URL.createObjectURL(workerBlob);
				workerUrlRef.current = workerUrl;
				const worker = new Worker(workerUrl);
				workerRef.current = worker;

				worker.onmessage = (event: MessageEvent) => {
					if (cancelled) {
						return;
					}

					const data = event.data;
					if (!data || typeof data !== "object") {
						return;
					}

					if (data.type === "progress") {
						setProgressText(
							`Обрабатываем изменения… ${data.processed ?? 0} узлов`,
						);
						return;
					}

					if (data.type === "done") {
						setDiffResult({
							summary: (data.summary ?? {
								added: 0,
								modified: 0,
								skippedDeletions: 0,
							}) as DiffSummary,
							changes: (data.changes ?? []) as DiffChangeItem[],
							truncated: Boolean(data.truncated),
						});
						setIsComputing(false);
						worker.terminate();
						workerRef.current = null;
						if (workerUrlRef.current) {
							URL.revokeObjectURL(workerUrlRef.current);
							workerUrlRef.current = null;
						}
					}

					if (data.type === "error") {
						setError(data.message ?? "Не удалось построить различия в worker");
						setIsComputing(false);
						worker.terminate();
						workerRef.current = null;
						if (workerUrlRef.current) {
							URL.revokeObjectURL(workerUrlRef.current);
							workerUrlRef.current = null;
						}
					}
				};

				worker.onerror = () => {
					if (!cancelled) {
						setError("Ошибка Web Worker");
						setIsComputing(false);
					}
					worker.terminate();
					workerRef.current = null;
					if (workerUrlRef.current) {
						URL.revokeObjectURL(workerUrlRef.current);
						workerUrlRef.current = null;
					}
				};

				worker.postMessage({ left: original, right: payload });
			} catch (err: any) {
				if (!cancelled) {
					setError(
						err?.message ?? "Не удалось построить различия для текущего JSON",
					);
				}
			} finally {
				if (!cancelled && !workerRef.current) {
					setIsComputing(false);
				}
			}
		}, DIFF_DEBOUNCE_MS);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);

			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
			if (workerUrlRef.current) {
				URL.revokeObjectURL(workerUrlRef.current);
				workerUrlRef.current = null;
			}
		};
	}, [open, commit, baselineData, commitPayload]);

	useEffect(() => {
		if (!open || !commit || !baselineData || !commitPayload) {
			setBaselineJsonText("");
			setCommitJsonText("");
			setIsPreparingText(false);
			return;
		}
		setIsPreparingText(true);
		let cancelled = false;
		const timer = window.setTimeout(() => {
			if (cancelled) return;
			const sortKeys = (obj: unknown): unknown => {
				if (obj === null || obj === undefined) return obj;
				if (Array.isArray(obj)) return obj.map(sortKeys);
				if (typeof obj === "object") {
					const sorted: Record<string, unknown> = {};
					Object.keys(obj)
						.sort()
						.forEach((key) => {
							sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
						});
					return sorted;
				}
				return obj;
			};
			const left = JSON.stringify(sortKeys(baselineData), null, 2);
			const right = JSON.stringify(sortKeys(commitPayload), null, 2);
			if (!cancelled) {
				setBaselineJsonText(left);
				setCommitJsonText(right);
				setIsPreparingText(false);
			}
		}, 0);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [open, commit, baselineData, commitPayload]);

	const handleToggleEntity = (entityKey: string) => {
		setExpandedEntityKeys((previous) => {
			if (previous.includes(entityKey)) {
				return previous.filter((key) => key !== entityKey);
			}
			return [...previous, entityKey];
		});
	};

	const handleClearSearch = () => {
		setLocalSearchQuery("");
		setDebouncedSearchQuery("");
	};

	const handleExpandAll = () => {
		setExpandedEntityKeys(filteredEntityKeys);
	};

	const handleCollapseAll = () => {
		setExpandedEntityKeys([]);
	};

	const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
		setLocalSearchQuery(event.target.value);
	};

	const highlightedLabel = (label: string): ReactNode => {
		if (!isSearchActive) {
			return renderHighlightedText(label, "");
		}

		const directMatch = filteredGroups.find(
			(group) => group.entityLabel === label,
		);
		if (!directMatch) {
			return renderHighlightedText(label, activeSearchQuery);
		}

		return renderHighlightedTextByIndexes(
			label,
			searchState.groupLabelMatchMap.get(directMatch.entityKey)?.indexes,
		);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogTitle>
				Различия с актуальным состоянием данных
				{commit && (
					<Typography variant="body2" color="text.secondary">
						{commit.commit_name} ({commit.id.slice(0, 8)})
					</Typography>
				)}
			</DialogTitle>
			<DialogContent sx={{ overflow: "hidden" }}>
				{(error || commitFetchError) && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error || commitFetchError?.message || "Ошибка загрузки коммита"}
					</Alert>
				)}

				{isDataLoading && (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: 1,
							minHeight: 180,
						}}
					>
						<CircularProgress size={24} />
						<Typography variant="body2" color="text.secondary">
							{isCommitPayloadLoading && isSnapshotLoading
								? "Загрузка данных коммита и актуального состояния…"
								: isCommitPayloadLoading
									? "Загрузка данных коммита…"
									: "Загрузка актуального состояния данных…"}
						</Typography>
					</Box>
				)}

				{!error && !commitFetchError && !isDataLoading && diffResult && (
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
						<Chip
							label={`Добавлено: ${diffResult.summary.added}`}
							size="small"
							color="success"
							variant="outlined"
						/>
						{diffResult.truncated && (
							<Chip
								label={`Показаны первые ${diffResult.changes.length} изменений`}
								size="small"
								variant="outlined"
							/>
						)}
					</Box>
				)}

				{!isDataLoading && (
					<Tabs
						value={diffMode}
						onChange={(_, value) => setDiffMode(value as "structured" | "line")}
						sx={{ mb: 2 }}
					>
						<Tab value="structured" label="Структурные различия" />
						<Tab value="line" label="Построчные различия" />
					</Tabs>
				)}

				{!isDataLoading && isComputing && (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: 1,
							minHeight: 180,
						}}
					>
						<CircularProgress size={24} />
						<Typography variant="body2" color="text.secondary">
							{progressText}
						</Typography>
					</Box>
				)}

				{!isDataLoading && !isComputing && !error && !commitFetchError && (
					<>
						{diffMode !== "line" && (
							<>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: 1,
										mb: 1,
									}}
								>
									<Typography variant="caption" color="text.secondary">
										Найдено сущностей: {filteredGroups.length}
									</Typography>
									<Box sx={{ display: "flex", gap: 1 }}>
										<Button
											size="small"
											onClick={handleExpandAll}
											disabled={filteredEntityKeys.length === 0}
										>
											Раскрыть все
										</Button>
										<Button
											size="small"
											onClick={handleCollapseAll}
											disabled={expandedEntityKeys.length === 0}
										>
											Свернуть все
										</Button>
									</Box>
								</Box>

								<TextField
									placeholder="Поиск..."
									data-test-id="diff-search-input"
									value={localSearchQuery}
									onChange={handleSearchChange}
									fullWidth
									size="small"
									sx={{ mb: 2 }}
									helperText={
										isSearchTooShort
											? `Введите минимум ${SEARCH_MIN_LENGTH} символа`
											: "Поиск по сущностям, путям и значениям"
									}
									slotProps={{
										input: {
											startAdornment: (
												<InputAdornment position="start">
													<SearchIcon fontSize="small" />
												</InputAdornment>
											),
											endAdornment: localSearchQuery && (
												<InputAdornment position="end">
													<IconButton size="small" onClick={handleClearSearch}>
														<CloseIcon fontSize="small" />
													</IconButton>
												</InputAdornment>
											),
										},
									}}
								/>

								<Spacer />
							</>
						)}

						<Box
							sx={{
								maxHeight: 520,
								overflow: "auto",
								display: diffMode === "structured" ? "block" : "none",
							}}
						>
							{!diffResult || diffResult.changes.length === 0 ? (
								<Alert severity="info" sx={{ mt: 1 }}>
									Изменений не найдено.
								</Alert>
							) : isSearchTooShort ? (
								<Alert severity="info" sx={{ mt: 1 }}>
									Введите минимум {SEARCH_MIN_LENGTH} символа для поиска.
								</Alert>
							) : filteredGroups.length === 0 ? (
								<Alert severity="info" sx={{ mt: 1 }}>
									По запросу "{activeSearchQuery}" ничего не найдено.
								</Alert>
							) : (
								filteredGroups.map((group) => {
									const expanded = expandedEntityKeys.includes(group.entityKey);
									return (
										<Accordion
											key={group.entityKey}
											expanded={expanded}
											onChange={() => handleToggleEntity(group.entityKey)}
											disableGutters
											sx={{ mb: 1 }}
										>
											<AccordionSummary expandIcon={<ExpandMoreIcon />}>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 1,
														flexWrap: "wrap",
													}}
												>
													<Typography variant="body2" sx={{ fontWeight: 600 }}>
														{highlightedLabel(group.entityLabel)}
													</Typography>
													<Chip
														label={`+${group.added}`}
														size="small"
														color="success"
														variant="outlined"
													/>
													<Chip
														label={`~${group.modified}`}
														size="small"
														color="warning"
														variant="outlined"
													/>
												</Box>
											</AccordionSummary>
											<AccordionDetails sx={{ pt: 0 }}>
												<Box
													sx={{
														display: "flex",
														flexDirection: "column",
														gap: 1,
													}}
												>
													{group.changes.map((change) => (
														<DiffChangeRow
															key={`${change.type}:${change.path}`}
															change={change}
															rowId={`diff-search-result-${encodeURIComponent(
																`${change.type}:${change.path}`,
															)}`}
															pathLabel={renderHighlightedTextByIndexes(
																formatDiffPathForDisplay(change.path),
																searchState.changePathMatchMap.get(
																	`${change.type}:${change.path}`,
																)?.indexes,
															)}
														/>
													))}
												</Box>
											</AccordionDetails>
										</Accordion>
									);
								})
							)}
						</Box>

						{diffMode === "line" && (
							<Box
								sx={{
									height: 520,
									border: "1px solid",
									borderColor: "divider",
									borderRadius: 1,
									overflow: "hidden",
								}}
							>
								{isPreparingText ? (
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											justifyContent: "center",
											gap: 1,
											height: "100%",
										}}
									>
										<CircularProgress size={24} />
										<Typography variant="body2" color="text.secondary">
											Подготовка данных…
										</Typography>
									</Box>
								) : baselineJsonText.length > LINE_DIFF_MAX_LENGTH ||
									commitJsonText.length > LINE_DIFF_MAX_LENGTH ? (
									<Alert severity="warning" sx={{ m: 2 }}>
										Данные слишком большие для построчного сравнения (
										{Math.round(
											Math.max(baselineJsonText.length, commitJsonText.length) /
												1_000_000,
										)}{" "}
										МБ). Используйте вкладку «Структурные различия».
									</Alert>
								) : (
									<Suspense
										fallback={
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													height: "100%",
												}}
											>
												<CircularProgress size={24} />
											</Box>
										}
									>
										<MonacoDiffEditor
											original={baselineJsonText}
											modified={commitJsonText}
											language="json"
											height={520}
											options={{
												readOnly: true,
												renderSideBySide: true,
												minimap: { enabled: false },
												scrollBeyondLastLine: false,
												fontSize: 12,
												wordWrap: "on",
											}}
										/>
									</Suspense>
								)}
							</Box>
						)}
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Закрыть</Button>
			</DialogActions>
		</Dialog>
	);
};
