import fuzzysort from "fuzzysort";

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
	T extends { name: string; namespace: string; type: string },
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
	T extends { sourceName: string; targetName: string },
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
	}));

	const results = fuzzysort.go(query, prepared, {
		keys: ["sourceName", "targetName"],
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
