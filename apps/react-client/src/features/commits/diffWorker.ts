const MAX_CHANGES_IN_OUTPUT = 20000;

export interface DiffChangeItem {
	path: string;
	type: "added" | "modified";
	entityKey: string;
	entityLabel: string;
	searchText: string;
	before?: unknown;
	after?: unknown;
}

export interface DiffSummary {
	added: number;
	modified: number;
	skippedDeletions: number;
}

export interface DiffComputationResult {
	summary: DiffSummary;
	changes: DiffChangeItem[];
	truncated: boolean;
}

export interface DiffEntityGroup {
	entityKey: string;
	entityLabel: string;
	added: number;
	modified: number;
	changes: DiffChangeItem[];
	searchText: string;
}

export const buildEntityGroups = (
	changes: DiffChangeItem[],
): DiffEntityGroup[] => {
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

const formatStableKeyLabel = (stableKey: string): string => {
	const [base, ...rest] = stableKey.split("::sys:");
	const sys = rest.length > 0 ? rest.join("::sys:") : "";
	const sysPart = sys ? ", sys=" + sys : "";

	if (base.startsWith("id:")) {
		return "id=" + base.slice(3) + sysPart;
	}
	if (base.startsWith("entityId:")) {
		return "entityId=" + base.slice(9) + sysPart;
	}
	if (base.startsWith("name:")) {
		return "name=" + base.slice(5) + sysPart;
	}
	if (base.startsWith("src:") && base.includes("::dst:")) {
		const [srcPart, dstPart] = base.split("::dst:");
		return "src=" + srcPart.slice(4) + ", dst=" + dstPart + sysPart;
	}
	return base + sysPart;
};

export const formatDiffPathForDisplay = (path: string): string => {
	if (!path) return "<root>";
	const parts = path.split(".");
	const formattedParts = parts.map((part) => {
		if (!part.startsWith("id:")) {
			return part;
		}
		const raw = part.slice(3);
		try {
			const decoded = decodeURIComponent(raw);
			return "id:" + formatStableKeyLabel(decoded);
		} catch {
			return part;
		}
	});
	return formattedParts.join(".");
};

export const formatEntityLabelForDisplay = (label: string): string => {
	const match = label.match(/\[id=([^\]]+)\]/);
	if (!match) {
		return label;
	}
	const stableKey = match[1] ?? "";
	if (!stableKey) {
		return label;
	}
	return label.replace(match[0], "[" + formatStableKeyLabel(stableKey) + "]");
};

export const convertDiffPathToRealPath = (
	path: string,
	data: unknown,
): string | null => {
	if (!path) return "";

	const parts = path.split(".");
	const realParts: string[] = [];
	let current = data;

	for (const part of parts) {
		if (!part.startsWith("id:")) {
			realParts.push(part);
			if (current && typeof current === "object" && !Array.isArray(current)) {
				current = (current as Record<string, unknown>)[part];
			}
			continue;
		}

		if (!Array.isArray(current)) {
			return null;
		}

		const encodedKey = part.slice(3);
		let decodedKey: string;
		try {
			decodedKey = decodeURIComponent(encodedKey);
		} catch {
			return null;
		}

		const arrayItems = current as unknown[];
		let foundIndex = -1;

		for (let i = 0; i < arrayItems.length; i++) {
			const item = arrayItems[i];
			if (!item || typeof item !== "object" || Array.isArray(item)) {
				continue;
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

			let itemStableKey = "";

			if (typeof idValue === "string" || typeof idValue === "number") {
				const id = String(idValue);
				itemStableKey = systemCode ? `id:${id}::sys:${systemCode}` : `id:${id}`;
			} else if (
				typeof entityIdValue === "string" ||
				typeof entityIdValue === "number"
			) {
				const entityId = String(entityIdValue);
				itemStableKey = systemCode
					? `entityId:${entityId}::sys:${systemCode}`
					: `entityId:${entityId}`;
			} else if (typeof nameValue === "string" && nameValue.trim().length > 0) {
				itemStableKey = `name:${nameValue.trim()}`;
			} else if (
				(typeof srcValue === "string" || typeof srcValue === "number") &&
				(typeof dstValue === "string" || typeof dstValue === "number")
			) {
				itemStableKey = `src:${String(srcValue)}::dst:${String(dstValue)}`;
			}

			if (itemStableKey === decodedKey) {
				foundIndex = i;
				break;
			}
		}

		if (foundIndex < 0) {
			return null;
		}

		realParts.push(String(foundIndex));
		current = arrayItems[foundIndex];
	}

	return realParts.join(".");
};

export const toPreview = (value: unknown, depth = 0): string => {
	if (value === undefined) return "undefined";
	if (value === null) return "null";
	if (typeof value === "string") {
		return value.length > 200 ? `${value.slice(0, 200)}…` : value;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) {
		if (depth >= 2 || value.length === 0) {
			return `[${value.length} items]`;
		}
		const items = value
			.slice(0, 3)
			.map((item) => toPreview(item, depth + 1))
			.join(", ");
		return value.length > 3
			? `[${items}, …+${value.length - 3}]`
			: `[${items}]`;
	}
	if (typeof value === "object") {
		const obj = value as Record<string, unknown>;
		const keys = Object.keys(obj);
		if (keys.length === 0) return "{}";
		if (depth >= 2) {
			return `{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "…" : ""}}`;
		}
		const entries = keys
			.slice(0, 4)
			.map((k) => `${k}: ${toPreview(obj[k], depth + 1)}`)
			.join(", ");
		return keys.length > 4
			? `{${entries}, …+${keys.length - 4}}`
			: `{${entries}}`;
	}
	return String(value);
};

export const getInlineStringDiff = (
	before: string,
	after: string,
): Array<{ text: string; type: "same" | "removed" | "added" }> => {
	if (before === after) return [{ text: before, type: "same" }];
	const words1 = before.split(/(\s+)/);
	const words2 = after.split(/(\s+)/);
	const n = words1.length;
	const m = words2.length;
	if (n + m > 400) {
		return [
			{ text: before, type: "removed" },
			{ text: after, type: "added" },
		];
	}
	const dp: number[][] = Array.from({ length: n + 1 }, () =>
		new Array(m + 1).fill(0),
	);
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			if (words1[i] === words2[j]) {
				dp[i][j] = dp[i + 1][j + 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
			}
		}
	}
	const result: Array<{ text: string; type: "same" | "removed" | "added" }> =
		[];
	let i = 0;
	let j = 0;
	while (i < n || j < m) {
		if (i < n && j < m && words1[i] === words2[j]) {
			result.push({ text: words1[i], type: "same" });
			i++;
			j++;
		} else if (
			j < m &&
			(i >= n || (dp[i + 1]?.[j] ?? 0) <= (dp[i]?.[j + 1] ?? 0))
		) {
			result.push({ text: words2[j], type: "added" });
			j++;
		} else {
			result.push({ text: words1[i], type: "removed" });
			i++;
		}
	}
	return result;
};

export const createDiffWorkerScript = (): string => {
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

	const formatStableKeyLabel = (stableKey) => {
		if (typeof stableKey !== "string" || stableKey.length === 0) {
			return stableKey;
		}
		const [base, ...rest] = stableKey.split("::sys:");
		const sys = rest.length > 0 ? rest.join("::sys:") : "";
		const sysPart = sys ? ", sys=" + sys : "";

		if (base.startsWith("id:")) {
			return "id=" + base.slice(3) + sysPart;
		}
		if (base.startsWith("entityId:")) {
			return "entityId=" + base.slice(9) + sysPart;
		}
		if (base.startsWith("name:")) {
			return "name=" + base.slice(5) + sysPart;
		}
		if (base.startsWith("src:") && base.includes("::dst:")) {
			const [srcPart, dstPart] = base.split("::dst:");
			return "src=" + srcPart.slice(4) + ", dst=" + dstPart + sysPart;
		}
		return base + sysPart;
	};

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
		const prettyKey = formatStableKeyLabel(decodedKey);
		return {
			entityKey: parts[0] + "." + parts[1],
			entityLabel: parts[0] + "[" + prettyKey + "]",
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
