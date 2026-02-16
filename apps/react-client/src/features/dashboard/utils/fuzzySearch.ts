import * as fuzzysort from "fuzzysort";

// ============================================================================
// Fuzzy Search Types
// ============================================================================

export interface FuzzySearchResult<T> {
	item: T;
	score: number;
	highlights: Map<string, string>; // field -> highlighted HTML
}

export interface FuzzyHighlightMatch {
	indices: readonly [number, number][];
	value: string;
}

function normalizeSearchText(text: string): string {
	return text.trim().toLowerCase();
}

function highlightSubstring(value: string, query: string): string {
	const normalizedValue = value.toLowerCase();
	const normalizedQuery = query.toLowerCase();
	const idx = normalizedValue.indexOf(normalizedQuery);
	if (idx < 0 || !normalizedQuery) return escapeHtml(value);
	const before = escapeHtml(value.slice(0, idx));
	const match = escapeHtml(value.slice(idx, idx + query.length));
	const after = escapeHtml(value.slice(idx + query.length));
	return `${before}<mark>${match}</mark>${after}`;
}

// ============================================================================
// Fuzzy Search Utilities
// ============================================================================

/**
 * Highlights matched characters in a string using <mark> tags
 */
export function highlightMatches(
	result: Fuzzysort.Result | null,
	fallbackValue: string,
): string {
	if (!result) return escapeHtml(fallbackValue);
	return result.highlight("<mark>", "</mark>") || escapeHtml(fallbackValue);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Perform fuzzy search on entities with multiple fields
 */
export function fuzzySearchEntities<
	T extends { id: string; name: string; namespace: string; type: string },
>(
	items: T[],
	query: string,
	options?: {
		threshold?: number;
		limit?: number;
	},
): FuzzySearchResult<T>[] {
	if (!query.trim()) {
		// Return all items with neutral score when no query
		return items.map((item) => ({
			item,
			score: 0,
			highlights: new Map(),
		}));
	}

	const { threshold = -10000, limit = 1000 } = options || {};

	// Prepare items for fuzzysort
	const prepared = items.map((item) => ({
		item,
		name: fuzzysort.prepare(item.name),
		namespace: fuzzysort.prepare(item.namespace),
		type: fuzzysort.prepare(item.type),
		originalId: fuzzysort.prepare(item.id),
	}));

	// Search across all fields
	const results = fuzzysort.go(query, prepared, {
		keys: ["name", "namespace", "type", "originalId"],
		threshold,
		limit,
		scoreFn: (a) => {
			// Prioritize name matches, then namespace, then type
			const nameScore = a[0]?.score ?? Number.NEGATIVE_INFINITY;
			const namespaceScore = a[1]?.score ?? Number.NEGATIVE_INFINITY;
			const typeScore = a[2]?.score ?? Number.NEGATIVE_INFINITY;
			const originalIdScore = a[3]?.score ?? Number.NEGATIVE_INFINITY;
			return Math.max(
				nameScore * 1.5,
				namespaceScore,
				typeScore * 0.8,
				originalIdScore,
			);
		},
	});

	return results.map((result) => {
		const highlights = new Map<string, string>();

		// Get highlights for each field
		if (result[0]) {
			highlights.set("name", highlightMatches(result[0], result.obj.item.name));
		}
		if (result[1]) {
			highlights.set(
				"namespace",
				highlightMatches(result[1], result.obj.item.namespace),
			);
		}
		if (result[2]) {
			highlights.set("type", highlightMatches(result[2], result.obj.item.type));
		}

		if (result[3]) {
			highlights.set(
				"originalId",
				highlightMatches(result[3], result.obj.item.id),
			);
		}

		return {
			item: result.obj.item,
			score: result.score,
			highlights,
		};
	});
}

/**
 * Strict (non-fuzzy) search: matches only if the full query appears as a contiguous substring.
 * Useful when you want to avoid "character-set" matches.
 */
export function strictSearchEntities<
	T extends {
		id: string;
		name?: string | null;
		namespace?: string | null;
		type?: string | null;
	},
>(items: T[], query: string): FuzzySearchResult<T>[] {
	const normalizedQuery = normalizeSearchText(query);
	if (!normalizedQuery) {
		return items.map((item) => ({
			item,
			score: 0,
			highlights: new Map(),
		}));
	}

	const matches: Array<{
		item: T;
		score: number;
		highlights: Map<string, string>;
	}> = [];

	for (const item of items) {
		const name = item.name ?? "";
		const namespace = item.namespace ?? "";
		const type = item.type ?? "";
		const originalId = item.id;

		const fields: Array<{ key: string; value: string; weight: number }> = [
			{ key: "name", value: name || originalId, weight: 0 },
			{ key: "namespace", value: namespace, weight: 1 },
			{ key: "type", value: type, weight: 2 },
			{ key: "originalId", value: originalId, weight: 3 },
		];

		let best: {
			weight: number;
			index: number;
			key: string;
			value: string;
		} | null = null;
		for (const field of fields) {
			if (!field.value) continue;
			const idx = field.value.toLowerCase().indexOf(normalizedQuery);
			if (idx < 0) continue;
			if (
				best === null ||
				field.weight < best.weight ||
				(field.weight === best.weight && idx < best.index)
			) {
				best = {
					weight: field.weight,
					index: idx,
					key: field.key,
					value: field.value,
				};
			}
		}

		if (!best) continue;

		const highlights = new Map<string, string>();
		for (const field of fields) {
			if (!field.value) continue;
			if (field.value.toLowerCase().includes(normalizedQuery)) {
				highlights.set(
					field.key,
					highlightSubstring(field.value, normalizedQuery),
				);
			}
		}

		// Higher score should mean "better"; use negative to keep compatibility with prior thresholds.
		const score = -best.weight * 10_000 - best.index;
		matches.push({ item, score, highlights });
	}

	// Best first: higher score (less negative) first
	matches.sort((a, b) => b.score - a.score);
	return matches;
}

/**
 * Perform fuzzy search on objects/attributes
 */
export function fuzzySearchObjects<
	T extends { name: string; description: string; dataType?: string },
>(
	items: T[],
	query: string,
	options?: {
		threshold?: number;
		limit?: number;
	},
): FuzzySearchResult<T>[] {
	if (!query.trim()) {
		return items.map((item) => ({
			item,
			score: 0,
			highlights: new Map(),
		}));
	}

	const { threshold = -10000, limit = 1000 } = options || {};

	const prepared = items.map((item) => ({
		item,
		name: fuzzysort.prepare(item.name),
		description: fuzzysort.prepare(item.description),
		dataType: fuzzysort.prepare(item.dataType || ""),
	}));

	const results = fuzzysort.go(query, prepared, {
		keys: ["name", "description", "dataType"],
		threshold,
		limit,
		scoreFn: (a) => {
			const nameScore = a[0]?.score ?? Number.NEGATIVE_INFINITY;
			const descScore = a[1]?.score ?? Number.NEGATIVE_INFINITY;
			const typeScore = a[2]?.score ?? Number.NEGATIVE_INFINITY;
			return Math.max(nameScore * 1.5, descScore, typeScore);
		},
	});

	return results.map((result) => {
		const highlights = new Map<string, string>();

		if (result[0]) {
			highlights.set("name", highlightMatches(result[0], result.obj.item.name));
		}
		if (result[1]) {
			highlights.set(
				"description",
				highlightMatches(result[1], result.obj.item.description),
			);
		}
		if (result[2] && result.obj.item.dataType) {
			highlights.set(
				"dataType",
				highlightMatches(result[2], result.obj.item.dataType),
			);
		}

		return {
			item: result.obj.item,
			score: result.score,
			highlights,
		};
	});
}

/**
 * Perform fuzzy search on links
 */
export function fuzzySearchLinks<
	T extends {
		sourceName: string;
		targetName: string;
		processName?: string;
		processCode?: string;
	},
>(
	items: T[],
	query: string,
	options?: {
		threshold?: number;
		limit?: number;
	},
): FuzzySearchResult<T>[] {
	if (!query.trim()) {
		return items.map((item) => ({
			item,
			score: 0,
			highlights: new Map(),
		}));
	}

	const { threshold = -10000, limit = 1000 } = options || {};

	const prepared = items.map((item) => ({
		item,
		sourceName: fuzzysort.prepare(item.sourceName),
		targetName: fuzzysort.prepare(item.targetName),
		processName: fuzzysort.prepare(item.processName || ""),
		processCode: fuzzysort.prepare(item.processCode || ""),
	}));

	const results = fuzzysort.go(query, prepared, {
		keys: ["sourceName", "targetName", "processName", "processCode"],
		threshold,
		limit,
	});

	return results.map((result) => {
		const highlights = new Map<string, string>();

		if (result[0]) {
			highlights.set(
				"sourceName",
				highlightMatches(result[0], result.obj.item.sourceName),
			);
		}
		if (result[1]) {
			highlights.set(
				"targetName",
				highlightMatches(result[1], result.obj.item.targetName),
			);
		}
		if (result[2] && result.obj.item.processName) {
			highlights.set(
				"processName",
				highlightMatches(result[2], result.obj.item.processName),
			);
		}
		if (result[3] && result.obj.item.processCode) {
			highlights.set(
				"processCode",
				highlightMatches(result[3], result.obj.item.processCode),
			);
		}

		return {
			item: result.obj.item,
			score: result.score,
			highlights,
		};
	});
}

/**
 * Simple single-field fuzzy match check
 */
export function fuzzyMatch(
	text: string,
	query: string,
): Fuzzysort.Result | null {
	if (!query.trim()) return null;
	return fuzzysort.single(query, text);
}

/**
 * Get highlighted HTML for a single field match
 */
export function getHighlightedText(text: string, query: string): string {
	if (!query.trim()) return escapeHtml(text);
	const result = fuzzysort.single(query, text);
	return highlightMatches(result, text);
}

/**
 * Check if an entity matches the search query (for graph highlighting)
 */
export function entityMatchesQuery(
	entity: { name: string; id: string; namespace?: string; type?: string },
	query: string,
	threshold = -5000,
): { matches: boolean; score: number } {
	if (!query.trim()) return { matches: false, score: 0 };

	const nameResult = fuzzysort.single(query, entity.name || entity.id);
	const namespaceResult = entity.namespace
		? fuzzysort.single(query, entity.namespace)
		: null;
	const typeResult = entity.type ? fuzzysort.single(query, entity.type) : null;

	const scores = [
		nameResult?.score ?? Number.NEGATIVE_INFINITY,
		namespaceResult?.score ?? Number.NEGATIVE_INFINITY,
		typeResult?.score ?? Number.NEGATIVE_INFINITY,
	];
	const maxScore = Math.max(...scores);

	return {
		matches: maxScore >= threshold,
		score: maxScore,
	};
}
