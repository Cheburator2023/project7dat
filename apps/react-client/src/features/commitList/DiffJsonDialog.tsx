import { useEffect, useMemo, useRef, useState } from "react";
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
import { useCurrentSchema } from "@react-client/features/entities/hooks";

const diffInstance = createDiff();
const DIFF_DEBOUNCE_MS = 220;
const SEARCH_DEBOUNCE_MS = 260;
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

const toPreview = (value: unknown): string => {
	if (value === undefined) return "undefined";
	if (value === null) return "null";
	if (typeof value === "string") {
		return value.length > 180 ? `${value.slice(0, 180)}…` : value;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) {
		return `[array(${value.length})]`;
	}
	if (typeof value === "object") {
		const keys = Object.keys(value as Record<string, unknown>);
		return keys.length === 0
			? "{object}"
			: `{object keys: ${keys.slice(0, 4).join(", ")}${keys.length > 4 ? "…" : ""}}`;
	}
	return String(value);
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
		const decodedKey = decodeURIComponent(rawKey);
		return {
			entityKey: `${parts[0]}.${parts[1]}`,
			entityLabel: `${parts[0]}[id=${decodedKey}]`,
		};
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
	if (typeof value === "string") {
		return value.length > 180 ? value.slice(0, 180) + "…" : value;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) {
		return "[array(" + value.length + ")]";
	}
	if (typeof value === "object") {
		const keys = Object.keys(value);
		return keys.length === 0
			? "{object}"
			: "{object keys: " + keys.slice(0, 4).join(", ") + (keys.length > 4 ? "…" : "") + "}";
	}
	return String(value);
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
		const decodedKey = decodeURIComponent(rawKey);
		return {
			entityKey: parts[0] + "." + parts[1],
			entityLabel: parts[0] + "[id=" + decodedKey + "]",
		};
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
	const { currentSchema } = useCurrentSchema();
	const [diffResult, setDiffResult] = useState<DiffComputationResult | null>(
		null,
	);
	const [isComputing, setIsComputing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [localSearchQuery, setLocalSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [expandedEntityKeys, setExpandedEntityKeys] = useState<string[]>([]);
	const [progressText, setProgressText] = useState(
		"Считаем diff к текущему JSON…",
	);
	const workerRef = useRef<Worker | null>(null);
	const workerUrlRef = useRef<string | null>(null);

	const baselineData = useMemo(
		() => (currentSchema as Record<string, unknown> | null) ?? null,
		[currentSchema],
	);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setDebouncedSearchQuery(localSearchQuery);
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			window.clearTimeout(timer);
		};
	}, [localSearchQuery]);

	const filteredGroups = useMemo(() => {
		if (!diffResult) return [];

		const groups = buildEntityGroups(diffResult.changes);
		if (!debouncedSearchQuery.trim()) {
			return groups;
		}

		const searchResults = fuzzyGo(debouncedSearchQuery, groups, {
			keys: ["entityLabel", "searchText"],
			threshold: -12000,
			limit: groups.length,
		});

		return searchResults.map((result) => result.obj as DiffEntityGroup);
	}, [diffResult, debouncedSearchQuery]);

	const filteredEntityKeys = useMemo(() => {
		return filteredGroups.map((group) => group.entityKey);
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
		if (!open || !commit) {
			setDiffResult(null);
			setError(null);
			setIsComputing(false);
			setLocalSearchQuery("");
			setDebouncedSearchQuery("");
			setExpandedEntityKeys([]);
			setProgressText("Считаем diff к текущему JSON…");

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

		setIsComputing(true);
		setError(null);
		setDiffResult(null);
		setProgressText("Готовим данные для diff…");

		let cancelled = false;
		const timer = window.setTimeout(async () => {
			if (cancelled) return;

			try {
				const original = baselineData ?? {};
				const payload =
					(commit.payload as Record<string, unknown> | null | undefined) ?? {};
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

				setProgressText("Large JSON: запускаем diff в Web Worker…");
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
						setError(data.message ?? "Не удалось построить diff в worker");
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
						setError("Ошибка Web Worker при построении diff");
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
						err?.message ?? "Не удалось построить diff для текущего JSON",
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
	}, [open, commit, baselineData]);

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
		return renderHighlightedText(label, debouncedSearchQuery);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogTitle>
				Diff к текущему JSON
				{commit && (
					<Typography variant="body2" color="text.secondary">
						{commit.commit_name} ({commit.id.slice(0, 8)})
					</Typography>
				)}
			</DialogTitle>
			<DialogContent sx={{ overflow: "hidden" }}>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{!error && diffResult && (
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
						<Chip
							label={`Добавлено: ${diffResult.summary.added}`}
							size="small"
							color="success"
							variant="outlined"
						/>
						<Chip
							label={`Изменено: ${diffResult.summary.modified}`}
							size="small"
							color="warning"
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

				{isComputing && (
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

				{!isComputing && !error && (
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
							placeholder="Поиск по сущностям и путям..."
							value={localSearchQuery}
							onChange={handleSearchChange}
							fullWidth
							size="small"
							sx={{ mb: 2 }}
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

						<Box sx={{ maxHeight: 520, overflow: "auto" }}>
							{!diffResult || diffResult.changes.length === 0 ? (
								<Alert severity="info" sx={{ mt: 1 }}>
									Изменений не найдено.
								</Alert>
							) : filteredGroups.length === 0 ? (
								<Alert severity="info" sx={{ mt: 1 }}>
									По запросу "{debouncedSearchQuery}" ничего не найдено.
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
														<Box
															key={`${change.type}:${change.path}`}
															sx={{
																border: "1px solid",
																borderColor: "divider",
																borderRadius: 1,
																p: 1,
																backgroundColor:
																	change.type === "added"
																		? "rgba(76, 175, 80, 0.08)"
																		: "rgba(255, 152, 0, 0.08)",
															}}
														>
															<Typography
																variant="caption"
																color="text.secondary"
															>
																{renderHighlightedText(
																	change.path || "<root>",
																	debouncedSearchQuery,
																)}
															</Typography>
															{change.type === "added" ? (
																<Typography variant="body2" sx={{ mt: 0.5 }}>
																	Новое value:{" "}
																	<b>
																		{renderHighlightedText(
																			toPreview(change.after),
																			debouncedSearchQuery,
																		)}
																	</b>
																</Typography>
															) : (
																<Typography variant="body2" sx={{ mt: 0.5 }}>
																	Было:{" "}
																	<b>
																		{renderHighlightedText(
																			toPreview(change.before),
																			debouncedSearchQuery,
																		)}
																	</b>{" "}
																	→ Стало:{" "}
																	<b>
																		{renderHighlightedText(
																			toPreview(change.after),
																			debouncedSearchQuery,
																		)}
																	</b>
																</Typography>
															)}
														</Box>
													))}
												</Box>
											</AccordionDetails>
										</Accordion>
									);
								})
							)}
						</Box>
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Закрыть</Button>
			</DialogActions>
		</Dialog>
	);
};
