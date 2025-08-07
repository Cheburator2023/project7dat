export interface JsonHighlightColors {
	string: string;
	number: string;
	boolean: string;
	null: string;
	key: string;
	punctuation: string;
}

export const getJsonHighlightColors = (
	isDark: boolean,
): JsonHighlightColors => ({
	string: isDark ? "#98D982" : "#2E7D32",
	number: isDark ? "#64B5F6" : "#1565C0",
	boolean: isDark ? "#FFB74D" : "#F57C00",
	null: isDark ? "#F48FB1" : "#C2185B",
	key: isDark ? "#81C784" : "#388E3C",
	punctuation: isDark ? "#FFD700" : "#B8860B",
});

export const highlightJson = (
	jsonString: string,
	colors: JsonHighlightColors,
): string => {
	let result = jsonString;

	// Use placeholders to avoid conflicts during multiple replacements
	const PLACEHOLDER_PREFIX = "___PLACEHOLDER_";
	let placeholderCounter = 0;
	const placeholders: { [key: string]: string } = {};

	// Helper function to create and store placeholders
	const createPlaceholder = (replacement: string): string => {
		const placeholder = `${PLACEHOLDER_PREFIX}${placeholderCounter++}___`;
		placeholders[placeholder] = replacement;
		return placeholder;
	};

	// Handle object keys (strings followed by colon)
	result = result.replace(
		/"([^"\\]*(\\.[^"\\]*)*)"\s*:/g,
		(_match, content) => {
			const replacement = `<span style="color: ${colors.key};">"${content}"</span><span style="color: ${colors.punctuation};">:</span>`;
			return createPlaceholder(replacement);
		},
	);

	// Handle remaining strings (values)
	result = result.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (_match, content) => {
		const replacement = `<span style="color: ${colors.string};">"${content}"</span>`;
		return createPlaceholder(replacement);
	});

	// Handle numbers
	result = result.replace(
		/\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
		(match) => {
			const replacement = `<span style="color: ${colors.number};">${match}</span>`;
			return createPlaceholder(replacement);
		},
	);

	// Handle booleans
	result = result.replace(/\b(true|false)\b/g, (match) => {
		const replacement = `<span style="color: ${colors.boolean};">${match}</span>`;
		return createPlaceholder(replacement);
	});

	// Handle null
	result = result.replace(/\bnull\b/g, () => {
		const replacement = `<span style="color: ${colors.null};">null</span>`;
		return createPlaceholder(replacement);
	});

	// Handle punctuation
	result = result.replace(/([{}[\],])/g, (match) => {
		const replacement = `<span style="color: ${colors.punctuation};">${match}</span>`;
		return createPlaceholder(replacement);
	});

	// Replace all placeholders with actual HTML
	Object.keys(placeholders).forEach((placeholder) => {
		result = result.replace(
			new RegExp(placeholder, "g"),
			placeholders[placeholder],
		);
	});

	return result;
};
