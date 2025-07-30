import React, {
	useCallback,
	useRef,
	useEffect,
	useLayoutEffect,
	memo,
	useMemo,
} from "react";
import { flushSync } from "react-dom";
import { styled, alpha, useColorScheme } from "@mui/material/styles";
import { TextField, IconButton, Box, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
	ExpandMore,
	ExpandLess,
	Edit,
	Check,
	Close,
} from "@mui/icons-material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";
import { create } from "zustand";
import { produce } from "immer";
import { FixedSizeList as List } from "react-window";

interface JsonEditorState {
	focusedPath: string | null;
	highlightedPaths: Record<string, boolean>;
	expandedPaths: Record<string, boolean>;
	editingPath: string | null;
	editValue: string;
	searchQuery: string;
	searchResults: string[];
	currentSearchIndex: number;
	jsonData: any;
	setJsonData: (data: any) => void;
	setJsonDataSilently: (data: any) => void;
	onChange: ((data: any) => void) | null;
	setOnChange: (callback: ((data: any) => void) | null) => void;
	setFocus: (path: string | null) => void;
	addHighlight: (path: string) => void;
	removeHighlight: (path: string) => void;
	clearHighlights: () => void;
	toggleExpanded: (path: string) => void;
	setExpanded: (path: string, expanded: boolean) => void;
	isExpanded: (path: string) => boolean;
	expandAll: (data: any) => void;
	startEditing: (path: string, value: string) => void;
	stopEditing: () => void;
	setEditValue: (value: string) => void;
	setSearchQuery: (query: string) => void;
	searchInData: (data: any, query: string) => void;
	clearSearch: () => void;
	goToNextResult: () => void;
	goToPrevResult: () => void;
	importFromFile: () => void;
	exportToFile: () => void;
}

export const useJsonEditorStore = create<JsonEditorState>((set, get) => ({
	focusedPath: null,
	highlightedPaths: {},
	expandedPaths: { "": true, address: true, hobbies: true },
	editingPath: null,
	editValue: "",
	searchQuery: "",
	searchResults: [],
	currentSearchIndex: -1,
	jsonData: null,
	setJsonData: (data) => {
		set({ jsonData: data });
		const { onChange } = get();
		onChange?.(data);
	},
	setJsonDataSilently: (data) => {
		set({ jsonData: data });
	},
	onChange: null,
	setOnChange: (callback) => set({ onChange: callback }),
	setFocus: (path) => set({ focusedPath: path }),
	addHighlight: (path) =>
		set(
			produce((state) => {
				state.highlightedPaths[path] = true;
			}),
		),
	removeHighlight: (path) =>
		set(
			produce((state) => {
				delete state.highlightedPaths[path];
			}),
		),
	clearHighlights: () => set({ highlightedPaths: {} }),
	toggleExpanded: (path) =>
		set(
			produce((state) => {
				state.expandedPaths[path] = !state.expandedPaths[path];
			}),
		),
	setExpanded: (path, expanded) =>
		set(
			produce((state) => {
				state.expandedPaths[path] = expanded;
			}),
		),
	isExpanded: (path) => Boolean(get().expandedPaths[path]),
	expandAll: (data) => {
		const allPaths = getAllExpandablePaths(data);
		const expandedPaths: Record<string, boolean> = {};
		allPaths.forEach((path) => {
			expandedPaths[path] = true;
		});
		set({ expandedPaths });
	},
	startEditing: (path, value) =>
		set({ editingPath: path, editValue: value, focusedPath: path }),
	stopEditing: () =>
		set({ editingPath: null, editValue: "", focusedPath: null }),
	setEditValue: (value) => set({ editValue: value }),
	setSearchQuery: (query) => set({ searchQuery: query }),
	searchInData: (data, query) => {
		if (!query.trim()) {
			set({ searchResults: [], currentSearchIndex: -1 });
			return;
		}

		const results = searchInJsonData(data, query.toLowerCase());
		set({
			searchResults: results,
			currentSearchIndex: results.length > 0 ? 0 : -1,
		});
	},
	clearSearch: () =>
		set({
			searchQuery: "",
			searchResults: [],
			currentSearchIndex: -1,
		}),
	goToNextResult: () => {
		const { searchResults, currentSearchIndex } = get();
		if (searchResults.length > 0) {
			const nextIndex = (currentSearchIndex + 1) % searchResults.length;
			set({ currentSearchIndex: nextIndex });
		}
	},
	goToPrevResult: () => {
		const { searchResults, currentSearchIndex } = get();
		if (searchResults.length > 0) {
			const prevIndex =
				currentSearchIndex <= 0
					? searchResults.length - 1
					: currentSearchIndex - 1;
			set({ currentSearchIndex: prevIndex });
		}
	},
	importFromFile: () => {
		const { setJsonData, expandAll } = get();
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.onchange = (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						const content = e.target?.result as string;
						const parsedData = JSON.parse(content);
						setJsonData(parsedData);
						expandAll(parsedData);
					} catch (error) {
						console.error("Ошибка при парсинге JSON:", error);
						alert("Ошибка при загрузке файла. Проверьте формат JSON.");
					}
				};
				reader.readAsText(file);
			}
		};
		input.click();
	},
	exportToFile: () => {
		const { jsonData } = get();
		const dataStr = JSON.stringify(jsonData, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement("a");
		link.href = url;
		link.download = `json-export-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	},
}));

const searchInJsonData = (data: any, query: string, path = ""): string[] => {
	const results: string[] = [];

	if (isPrimitive(data)) {
		const stringValue = String(data).toLowerCase();
		if (stringValue.includes(query)) {
			results.push(path);
		}
		return results;
	}

	const isArray = Array.isArray(data);
	const entries = isArray
		? data.map((item, index) => [index, item])
		: Object.entries(data);

	entries.forEach(([key, value]) => {
		const keyString = String(key).toLowerCase();
		const currentPath = path === "" ? String(key) : `${path}.${key}`;

		// Поиск в ключах
		if (keyString.includes(query)) {
			results.push(currentPath);
		}

		// Поиск в значениях
		if (isPrimitive(value)) {
			const stringValue = String(value).toLowerCase();
			if (stringValue.includes(query)) {
				results.push(currentPath);
			}
		} else {
			// Рекурсивный поиск в объектах/массивах
			results.push(...searchInJsonData(value, query, currentPath));
		}
	});

	return results;
};

const getAllExpandablePaths = (data: any, path = ""): string[] => {
	const paths: string[] = [];

	if (isPrimitive(data)) {
		return paths;
	}

	const isArray = Array.isArray(data);
	const entries = isArray
		? data.map((item, index) => [index, item])
		: Object.entries(data);

	if (path === "") {
		paths.push("");
		entries.forEach(([key, value]) => {
			const currentPath = String(key);
			if (!isPrimitive(value)) {
				paths.push(currentPath);
				paths.push(...getAllExpandablePaths(value, currentPath));
			}
		});
	} else {
		entries.forEach(([key, value]) => {
			const currentPath = `${path}.${key}`;
			if (!isPrimitive(value)) {
				paths.push(currentPath);
				paths.push(...getAllExpandablePaths(value, currentPath));
			}
		});
	}

	return paths;
};

const isPrimitive = (value: any): boolean => {
	return value === null || typeof value !== "object";
};

const getValueType = (value: any): string => {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	return typeof value;
};

const formatValue = (value: any): string => {
	if (typeof value === "string") return `"${value}"`;
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	return String(value);
};

const getTypeHint = (originalValue: any): string => {
	const type = getValueType(originalValue);
	switch (type) {
		case "string":
			return "Строка";
		case "number":
			return "Число";
		case "boolean":
			return "true или false";
		case "null":
		case "undefined":
			return "Любой тип";
		default:
			return "Значение";
	}
};

const validateInput = (editValue: string, originalValue: any): boolean => {
	const originalType = getValueType(originalValue);

	if (originalValue === null || originalValue === undefined) {
		return true; // null и undefined могут быть изменены на любой тип
	}

	switch (originalType) {
		case "string":
			return true; // строки всегда валидны
		case "number":
			return !Number.isNaN(Number(editValue)) && editValue.trim() !== "";
		case "boolean":
			return editValue === "true" || editValue === "false";
		default:
			return true;
	}
};

const parseEditValue = (editValue: string, originalValue: any): any => {
	const originalType = getValueType(originalValue);

	// Если исходное значение null или undefined, разрешаем изменение типа
	if (originalValue === null || originalValue === undefined) {
		if (editValue === "true" || editValue === "false") {
			return editValue === "true";
		}
		if (!Number.isNaN(Number(editValue)) && editValue.trim() !== "") {
			return Number(editValue);
		}
		if (editValue === "null") {
			return null;
		}
		if (editValue === "undefined") {
			return undefined;
		}
		return editValue;
	}

	// Принудительно сохраняем исходный тип
	switch (originalType) {
		case "string":
			return editValue;
		case "number": {
			const numValue = Number(editValue);
			if (Number.isNaN(numValue)) {
				// Если не удается преобразовать в число, возвращаем исходное значение
				return originalValue;
			}
			return numValue;
		}
		case "boolean":
			if (editValue === "true") return true;
			if (editValue === "false") return false;
			// Если не булево значение, возвращаем исходное
			return originalValue;
		default:
			return editValue;
	}
};

interface FlatJsonNode {
	path: string;
	key: string | number;
	value: any;
	depth: number;
	isLast: boolean;
	isExpandable: boolean;
	isExpanded: boolean;
	parentPath: string;
	nodeType: "opening" | "property" | "closing";
	syntaxElement?: string;
	isArrayElement?: boolean;
	showInlineOpeningBrace?: boolean;
}

const flattenJsonData = (
	data: any,
	expandedPaths: Record<string, boolean>,
	path = "",
	depth = 0,
): FlatJsonNode[] => {
	const result: FlatJsonNode[] = [];

	if (isPrimitive(data)) {
		return [
			{
				path,
				key: path.split(".").pop() || "",
				value: data,
				depth,
				isLast: true,
				isExpandable: false,
				isExpanded: false,
				parentPath: path.split(".").slice(0, -1).join("."),
				nodeType: "property",
			},
		];
	}

	const isArray = Array.isArray(data);
	const entries = isArray
		? data.map((item, index) => [index, item])
		: Object.entries(data);

	// Для корневого объекта
	if (path === "" && expandedPaths[""]) {
		// Добавляем открывающую скобку для корневого объекта
		result.push({
			path: "__root_opening__",
			key: "",
			value: data,
			depth: 0,
			isLast: false,
			isExpandable: true,
			isExpanded: true,
			parentPath: "",
			nodeType: "opening",
			syntaxElement: isArray ? "[" : "{",
			isArrayElement: isArray,
		});

		entries.forEach(([key, value], index) => {
			const currentPath = String(key);
			const isLast = index === entries.length - 1;
			const isExpandable = !isPrimitive(value);
			const isExpanded = Boolean(expandedPaths[currentPath]);

			result.push({
				path: currentPath,
				key,
				value,
				depth: depth + 1,
				isLast,
				isExpandable,
				isExpanded,
				parentPath: "",
				nodeType: "property",
				isArrayElement: isArray,
				showInlineOpeningBrace: isExpandable && isExpanded,
			});

			if (isExpandable && isExpanded) {
				result.push(
					...flattenJsonData(value, expandedPaths, currentPath, depth + 1),
				);
			}
		});

		// Добавляем закрывающую скобку для корневого объекта
		result.push({
			path: "__root_closing__",
			key: "",
			value: data,
			depth: 0,
			isLast: true,
			isExpandable: true,
			isExpanded: true,
			parentPath: "",
			nodeType: "closing",
			syntaxElement: isArray ? "]" : "}",
			isArrayElement: isArray,
		});
	} else if (path !== "") {
		// Для вложенных объектов/массивов
		if (expandedPaths[path]) {
			entries.forEach(([key, value], index) => {
				const currentPath = `${path}.${key}`;
				const isLast = index === entries.length - 1;
				const isExpandable = !isPrimitive(value);
				const isExpanded = Boolean(expandedPaths[currentPath]);

				result.push({
					path: currentPath,
					key,
					value,
					depth: depth + 1,
					isLast,
					isExpandable,
					isExpanded,
					parentPath: path,
					nodeType: "property",
					isArrayElement: isArray,
					showInlineOpeningBrace: isExpandable && isExpanded,
				});

				if (isExpandable && isExpanded) {
					result.push(
						...flattenJsonData(value, expandedPaths, currentPath, depth + 1),
					);
				}
			});

			// Добавляем закрывающую скобку для вложенного объекта/массива
			// Определяем isLast на основе родительского контекста
			const parentPathParts = path.split(".");
			const parentKey = parentPathParts[parentPathParts.length - 1];
			const grandParentPath = parentPathParts.slice(0, -1).join(".");

			let isLastInParent = true;
			if (grandParentPath !== "" || parentPathParts.length === 1) {
				// Получаем родительский объект для определения позиции
				const parentData =
					grandParentPath === ""
						? parentPathParts.length === 1
							? data
							: null
						: getValueByPath(data, grandParentPath);

				if (parentData) {
					const parentIsArray = Array.isArray(parentData);
					const parentEntries = parentIsArray
						? parentData.map((item: any, index: number) => [index, item])
						: Object.entries(parentData);

					const currentIndex = parentEntries.findIndex(
						([key]) => String(key) === parentKey,
					);
					isLastInParent = currentIndex === parentEntries.length - 1;
				}
			}

			result.push({
				path: `${path}__closing__`,
				key: "",
				value: data,
				depth: depth,
				isLast: isLastInParent,
				isExpandable: true,
				isExpanded: true,
				parentPath: path,
				nodeType: "closing",
				syntaxElement: isArray ? "]" : "}",
				isArrayElement: isArray,
			});
		}
	}

	return result;
};

// Вспомогательная функция для получения значения по пути
const getValueByPath = (obj: any, path: string): any => {
	if (!path) return obj;
	return path.split(".").reduce((current, key) => current?.[key], obj);
};

const SearchContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1),
	padding: theme.spacing(1),
	borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SearchField = styled(TextField)(({ theme }) => ({}));

const SearchResults = styled(Typography)(({ theme }) => ({
	fontSize: "12px",
	color: theme.palette.text.secondary,
	minWidth: "80px",
	textAlign: "center",
}));

const Container = styled(Box)(({ theme }) => ({
	fontFamily: 'Monaco, "Lucida Console", monospace',
	overflow: "hidden",
	display: "flex",
	flexDirection: "column",
	zoom: 0.8,
}));

const JsonLine = styled(Box, {
	shouldForwardProp: (prop) => !prop.toString().startsWith("$"),
})<{
	$isHighlighted?: boolean;
	$isFocused?: boolean;
	$depth: number;
	$isSearchMatch?: boolean;
	$isCurrentSearchResult?: boolean;
	$isDark?: boolean;
	"data-path"?: string;
}>(
	({
		theme,
		$isHighlighted,
		$isFocused,
		$depth,
		$isSearchMatch,
		$isCurrentSearchResult,
		$isDark,
	}) => ({
		display: "flex",
		alignItems: "center",
		paddingRight: theme.spacing(1),
		minHeight: "32px",
		height: "32px",
		gap: theme.spacing(0.5),
		backgroundColor: $isCurrentSearchResult
			? $isDark
				? alpha(theme.palette.secondary.main, 0.3)
				: theme.palette.secondary.light
			: $isSearchMatch
				? $isDark
					? alpha(theme.palette.secondary.main, 0.15)
					: theme.palette.secondary.main + "20"
				: $isFocused
					? $isDark
						? alpha(theme.palette.primary.main, 0.2)
						: alpha(theme.palette.primary.main, 0.1)
					: $isHighlighted
						? $isDark
							? alpha(theme.palette.warning.main, 0.25)
							: alpha(theme.palette.warning.main, 0.2)
						: "transparent",
		"&:hover": {
			backgroundColor: theme.palette.action.hover,
		},
		transition: "background-color 0.2s ease",
		cursor: "pointer",
	}),
);

const LineNumberColumn = styled(Box)<{ $isDark?: boolean }>(
	({ theme, $isDark }) => ({
		width: "60px",
		backgroundColor: $isDark ? theme.palette.grey[900] : theme.palette.grey[50],
		borderRight: `1px solid ${theme.palette.divider}`,
		fontSize: "12px",
		color: theme.palette.text.secondary,
		userSelect: "none",
		flexShrink: 0,
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-end",
		paddingRight: theme.spacing(1),
		minHeight: "32px",
		height: "32px",
	}),
);

const ContentColumn = styled(Box)<{ $depth: number }>(({ theme, $depth }) => ({
	flex: 1,
	display: "flex",
	alignItems: "center",
	paddingLeft: theme.spacing($depth * 2 + 1),
	minHeight: "32px",
	height: "32px",
}));

const EditableValue = styled(TextField)(({ theme }) => ({
	"& .MuiInputBase-input": {
		fontFamily: 'Monaco, "Lucida Console", monospace',
		fontSize: "14px",
		padding: "2px 4px",
	},
	"& .MuiOutlinedInput-root": {
		"& fieldset": {
			border: "none",
		},
	},
}));

const KeyText = styled(Typography, {
	shouldForwardProp: (prop) => !prop.toString().startsWith("$"),
})<{ $isDark?: boolean; $isSelectedNodeName?: boolean }>(
	({ theme, $isDark, $isSelectedNodeName }) => ({
		color: $isDark ? theme.palette.primary.light : theme.palette.primary.main,
		fontWeight: "bold",
		marginRight: theme.spacing(1),
		backgroundColor: $isSelectedNodeName
			? $isDark
				? theme.palette.warning.dark
				: theme.palette.warning.light
			: "transparent",
		padding: $isSelectedNodeName ? theme.spacing(0.25, 0.5) : 0,
		borderRadius: $isSelectedNodeName ? theme.shape.borderRadius : 0,
		transition: "background-color 0.3s ease, padding 0.3s ease",
	}),
);

const ValueText = styled(Typography, {
	shouldForwardProp: (prop) => !prop.toString().startsWith("$"),
})<{ $type: string; $isDark?: boolean }>(({ theme, $type, $isDark }) => {
	const getTypeColor = () => {
		switch ($type) {
			case "string":
				return $isDark ? "#98D982" : "#2E7D32";
			case "number":
				return $isDark ? "#64B5F6" : "#1565C0";
			case "boolean":
				return $isDark ? "#FFB74D" : "#F57C00";
			case "null":
				return $isDark ? "#F48FB1" : "#C2185B";
			case "undefined":
				return $isDark ? "#CE93D8" : "#7B1FA2";
			default:
				return theme.palette.text.primary;
		}
	};

	return {
		color: getTypeColor(),
		fontWeight: $type === "string" ? 400 : 500,
		fontStyle: $type === "null" || $type === "undefined" ? "italic" : "normal",
		cursor: "pointer",
		padding: theme.spacing(0.5, 1),
		borderRadius: theme.shape.borderRadius,
		flex: 1,
		minWidth: 0,
		"&:hover": {
			backgroundColor: theme.palette.action.hover,
		},
		transition: "background-color 0.2s ease, color 0.2s ease",
	};
});

const EditActions = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(0.5),
	marginLeft: "auto",
	flexShrink: 0,
}));

const ValueContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	flex: 1,
	minWidth: 0,
	gap: theme.spacing(0.5),
}));

const _JsonSyntax = styled("span")(({ theme }) => ({
	color: theme.palette.warning.main,
	fontWeight: "bold",
	fontSize: "16px",
}));

interface JsonSearchBarProps {
	data: any;
}

const JsonSearchBar: React.FC<JsonSearchBarProps> = ({ data }) => {
	const {
		searchQuery,
		searchResults,
		currentSearchIndex,
		setSearchQuery,
		searchInData,
		clearSearch,
		goToNextResult,
		goToPrevResult,
		setFocus,
	} = useJsonEditorStore();

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const query = event.target.value;
		setSearchQuery(query);
		searchInData(data, query);
	};

	const handleClear = () => {
		clearSearch();
	};

	const handleNext = () => {
		goToNextResult();
		if (searchResults.length > 0) {
			const nextIndex = (currentSearchIndex + 1) % searchResults.length;
			setFocus(searchResults[nextIndex]);
		}
	};

	const handlePrev = () => {
		goToPrevResult();
		if (searchResults.length > 0) {
			const prevIndex =
				currentSearchIndex <= 0
					? searchResults.length - 1
					: currentSearchIndex - 1;
			setFocus(searchResults[prevIndex]);
		}
	};

	return (
		<SearchContainer>
			<SearchIcon fontSize="small" />
			<SearchField
				placeholder="Поиск в JSON..."
				value={searchQuery}
				onChange={handleSearchChange}
				variant="outlined"
				size="small"
			/>
			{searchQuery && (
				<>
					<SearchResults>
						{searchResults.length > 0
							? `${currentSearchIndex + 1} из ${searchResults.length}`
							: "0 из 0"}
					</SearchResults>
					<IconButton
						size="small"
						onClick={handlePrev}
						disabled={searchResults.length === 0}
					>
						<KeyboardArrowUpIcon fontSize="small" />
					</IconButton>
					<IconButton
						size="small"
						onClick={handleNext}
						disabled={searchResults.length === 0}
					>
						<KeyboardArrowDownIcon fontSize="small" />
					</IconButton>
					<IconButton size="small" onClick={handleClear}>
						<ClearIcon fontSize="small" />
					</IconButton>
				</>
			)}
		</SearchContainer>
	);
};

interface JsonNodeProps {
	node: FlatJsonNode;
	lineNumber: number;
	onUpdate: (path: string, value: any) => void;
	onToggleExpand: (path: string) => void;
	isHighlighted: boolean;
	isFocused: boolean;
	onNodeClick: (path: string) => void;
	isDark: boolean;
	selectedNodes: string[];
	currentGraph?: any;
	changedPaths: Set<string>;
}

const isSelectedNodeName = (
	node: FlatJsonNode,
	selectedNodes: string[],
	currentGraph?: any,
): boolean => {
	if (!currentGraph || selectedNodes.length === 0) return false;

	const pathParts = node.path.split(".");
	if (
		pathParts.length >= 3 &&
		pathParts[0] === "entities" &&
		pathParts[2] === "name"
	) {
		const entityIndex = Number.parseInt(pathParts[1], 10);
		const graphEntity = currentGraph.entities[entityIndex];
		return graphEntity && selectedNodes.includes(graphEntity.id);
	}

	return false;
};

const JsonNodeComponent: React.FC<JsonNodeProps> = memo(
	({
		node,
		lineNumber,
		onUpdate,
		onToggleExpand,
		isHighlighted,
		isFocused,
		onNodeClick,
		isDark,
		selectedNodes,
		currentGraph,
		changedPaths,
	}) => {
		const inputRef = useRef<HTMLDivElement>(null);
		const nodeRef = useRef<HTMLDivElement>(null);

		const {
			editingPath,
			editValue,
			startEditing,
			stopEditing,
			setEditValue,
			searchResults,
			currentSearchIndex,
		} = useJsonEditorStore(
			useShallow((state) => ({
				editingPath: state.editingPath,
				editValue: state.editValue,
				startEditing: state.startEditing,
				stopEditing: state.stopEditing,
				setEditValue: state.setEditValue,
				searchResults: state.searchResults,
				currentSearchIndex: state.currentSearchIndex,
			})),
		);

		const isEditing = editingPath === node.path;
		const isSearchMatch = searchResults.includes(node.path);
		const isCurrentSearchResult =
			searchResults[currentSearchIndex] === node.path;
		const isNodeNameSelected = isSelectedNodeName(
			node,
			selectedNodes,
			currentGraph,
		);
		const hasChanges = changedPaths.has("*") || changedPaths.has(node.path);

		useEffect(() => {
			if (isFocused && inputRef.current) {
				const input = inputRef.current.querySelector("input");
				if (input) {
					input.focus();
					input.select();
				}
			}
		}, [isFocused]);

		useEffect(() => {
			if (isEditing && inputRef.current) {
				const input = inputRef.current.querySelector("input");
				if (input) {
					setTimeout(() => {
						input.focus();
						input.select();
					}, 0);
				}
			}
		}, [isEditing, node.path]);

		const handleEdit = useCallback(
			(value: any) => {
				startEditing(node.path, String(value));
			},
			[node.path, startEditing],
		);

		const handleSave = useCallback(() => {
			const parsedValue = parseEditValue(editValue, node.value);
			onUpdate(node.path, parsedValue);
			// Останавливаем редактирование сразу после обновления
			stopEditing();
		}, [editValue, onUpdate, node.path, stopEditing, node.value]);

		const handleCancel = useCallback(() => {
			stopEditing();
		}, [stopEditing]);

		const handleKeyPress = useCallback(
			(e: React.KeyboardEvent) => {
				if (e.key === "Enter") {
					handleSave();
				} else if (e.key === "Escape") {
					handleCancel();
				}
			},
			[handleSave, handleCancel],
		);

		const handleNodeClickInternal = useCallback(() => {
			onNodeClick(node.path);
		}, [node.path, onNodeClick]);

		const handleToggleExpand = useCallback(() => {
			onToggleExpand(node.path);
		}, [node.path, onToggleExpand]);

		// Обработка синтаксических элементов (открывающие и закрывающие скобки)
		if (node.nodeType === "opening" || node.nodeType === "closing") {
			// Определяем, нужна ли запятая после закрывающей скобки
			const needsComma = node.nodeType === "closing" && !node.isLast;

			return (
				<JsonLine
					ref={nodeRef}
					data-path={node.path}
					data-test-id={`json-syntax-${node.nodeType}-${node.path.replace(/\./g, "-")}`}
					$depth={node.depth}
					$isSearchMatch={isSearchMatch}
					$isCurrentSearchResult={isCurrentSearchResult}
					$isDark={isDark}
				>
					<LineNumberColumn $isDark={isDark}>{lineNumber}</LineNumberColumn>
					<ContentColumn $depth={node.depth}>
						<Typography
							sx={{
								color: isDark ? "#FFD700" : "#B8860B",
								fontWeight: "bold",
								fontSize: "16px",
							}}
						>
							{node.syntaxElement}
						</Typography>
						{needsComma && (
							<Typography
								sx={{
									color: isDark ? "#FFD700" : "#B8860B",
									fontWeight: "bold",
									marginLeft: "2px",
								}}
							>
								,
							</Typography>
						)}
					</ContentColumn>
				</JsonLine>
			);
		}

		// Обработка примитивных значений
		if (!node.isExpandable) {
			const needsComma = !node.isLast;

			return (
				<JsonLine
					ref={nodeRef}
					data-path={node.path}
					data-test-id={`json-node-primitive-${node.path.replace(/\./g, "-")}`}
					$depth={node.depth}
					$isSearchMatch={isSearchMatch}
					$isCurrentSearchResult={isCurrentSearchResult}
					$isDark={isDark}
				>
					<LineNumberColumn $isDark={isDark}>{lineNumber}</LineNumberColumn>
					<ContentColumn $depth={node.depth}>
						{!node.isArrayElement && node.key !== "" && (
							<KeyText
								$isDark={isDark}
								$isSelectedNodeName={isNodeNameSelected}
								data-test-id={`json-key-${node.path.replace(/\./g, "-")}`}
							>
								"{node.key}":
							</KeyText>
						)}
						{isEditing ? (
							<ValueContainer
								data-test-id={`json-value-editing-${node.path.replace(/\./g, "-")}`}
							>
								<EditableValue
									ref={inputRef}
									value={editValue}
									onChange={(e) => setEditValue(e.target.value)}
									onKeyDown={handleKeyPress}
									size="small"
									variant="outlined"
									sx={{ flex: 1 }}
									error={!validateInput(editValue, node.value)}
									helperText={
										!validateInput(editValue, node.value)
											? `Ожидается: ${getTypeHint(node.value)}`
											: `Тип: ${getTypeHint(node.value)}`
									}
									data-test-id={`json-input-${node.path.replace(/\./g, "-")}`}
								/>
								<EditActions>
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											handleSave();
										}}
										disabled={!validateInput(editValue, node.value)}
										data-test-id={`json-save-btn-${node.path.replace(/\./g, "-")}`}
									>
										<Check fontSize="small" />
									</IconButton>
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											handleCancel();
										}}
										data-test-id={`json-cancel-btn-${node.path.replace(/\./g, "-")}`}
									>
										<Close fontSize="small" />
									</IconButton>
								</EditActions>
							</ValueContainer>
						) : (
							<ValueContainer
								data-test-id={`json-value-container-${node.path.replace(/\./g, "-")}`}
							>
								<ValueText
									$type={getValueType(node.value)}
									$isDark={isDark}
									onClick={
										hasChanges
											? (e) => {
													e.stopPropagation();
													handleEdit(node.value);
												}
											: undefined
									}
									data-test-id={`json-value-${node.path.replace(/\./g, "-")}`}
									sx={{
										cursor: hasChanges ? "pointer" : "default",
										opacity: hasChanges ? 1 : 0.7,
									}}
								>
									{formatValue(node.value)}
								</ValueText>
								{hasChanges && (
									<EditActions>
										<IconButton
											size="small"
											onClick={(e) => {
												e.stopPropagation();
												handleEdit(node.value);
											}}
											sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
											data-test-id={`json-edit-btn-${node.path.replace(/\./g, "-")}`}
										>
											<Edit fontSize="small" />
										</IconButton>
									</EditActions>
								)}
							</ValueContainer>
						)}
						{needsComma && (
							<Typography
								sx={{
									color: isDark ? "#FFD700" : "#B8860B",
									fontWeight: "bold",
									marginLeft: "2px",
								}}
							>
								,
							</Typography>
						)}
					</ContentColumn>
				</JsonLine>
			);
		}

		// Обработка расширяемых объектов/массивов (только заголовок с ключом)
		const isArray = Array.isArray(node.value);
		const entries = isArray
			? node.value.map((item: any, index: number) => [index, item])
			: Object.entries(node.value);
		const needsComma = !node.isLast;

		return (
			<JsonLine
				ref={nodeRef}
				data-path={node.path}
				data-test-id={`json-node-expandable-${node.path.replace(/\./g, "-")}`}
				$depth={node.depth}
				$isSearchMatch={isSearchMatch}
				$isCurrentSearchResult={isCurrentSearchResult}
				$isDark={isDark}
				onClick={handleNodeClickInternal}
			>
				<LineNumberColumn $isDark={isDark}>{lineNumber}</LineNumberColumn>
				<ContentColumn $depth={node.depth}>
					<IconButton
						size="small"
						onClick={(e) => {
							e.stopPropagation();
							handleToggleExpand();
						}}
						sx={{ flexShrink: 0 }}
						data-test-id={`json-expand-btn-${node.path.replace(/\./g, "-")}`}
					>
						{node.isExpanded ? <ExpandLess /> : <ExpandMore />}
					</IconButton>
					{!node.isArrayElement && node.key !== "" && (
						<KeyText
							$isDark={isDark}
							$isSelectedNodeName={isNodeNameSelected}
							data-test-id={`json-key-${node.path.replace(/\./g, "-")}`}
						>
							"{node.key}":
						</KeyText>
					)}

					{/* Рендерим скобки только для свернутых элементов */}
					{!node.isExpanded && (
						<>
							<Typography
								sx={{
									color: isDark ? "#FFD700" : "#B8860B",
									fontWeight: "bold",
									fontSize: "16px",
								}}
							>
								{isArray ? "[" : "{"}
							</Typography>
							<Typography
								sx={{ ml: 1, color: "text.secondary" }}
								data-test-id={`json-collapsed-info-${node.path.replace(/\./g, "-")}`}
							>
								...{entries.length} {isArray ? "элементов" : "свойств"}
							</Typography>
							<Typography
								sx={{
									color: isDark ? "#FFD700" : "#B8860B",
									fontWeight: "bold",
									fontSize: "16px",
								}}
							>
								{isArray ? "]" : "}"}
							</Typography>
							{needsComma && (
								<Typography
									sx={{
										color: isDark ? "#FFD700" : "#B8860B",
										fontWeight: "bold",
										marginLeft: "2px",
									}}
								>
									,
								</Typography>
							)}
						</>
					)}
				</ContentColumn>
			</JsonLine>
		);
	},
);

interface CodeJsonEditorProps {
	initialData?: any;
	onChange?: (data: any) => void;
	isInitializing?: boolean;
}

export const CodeJsonEditor: React.FC<CodeJsonEditorProps> = ({
	initialData = {
		name: "Пример",
		age: 25,
		price: 99.99,
		active: true,
		verified: false,
		description: null,
		metadata: undefined,
		address: {
			city: "Москва",
			country: "Россия",
			zipCode: null,
		},
		hobbies: ["чтение", "программирование"],
		scores: [85, 92, 78],
		settings: {
			theme: "dark",
			notifications: true,
			autoSave: false,
			maxRetries: 3,
		},
	},
	onChange,
	isInitializing = false,
}) => {
	const { mode } = useColorScheme();
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<List>(null);
	const isUpdatingFromStore = useRef(false);

	const {
		focusedPath,
		highlightedPaths,
		expandedPaths,
		jsonData,
		setJsonData,
		setJsonDataSilently,
		setOnChange,
		setFocus,
		addHighlight,
		removeHighlight,
		clearHighlights,
		toggleExpanded,
		setExpanded,
		expandAll,
		searchResults,
		currentSearchIndex,
	} = useJsonEditorStore();

	// Initialize store data and onChange callback
	useEffect(() => {
		if (initialData && !jsonData) {
			setJsonDataSilently(initialData);
		}
		setOnChange(onChange || null);
	}, [initialData, jsonData, setJsonDataSilently, onChange, setOnChange]);

	const {
		revealPosition,
		isNeedReveal,
		currentGraph,
		hasUnsavedChanges,
		selectedNodes,
		selectNode,
		setRevealPosition,
		updateNode,
		markAsChanged,
	} = useDataLineageStore(
		useShallow((state) => ({
			revealPosition: state.revealPosition,
			isNeedReveal: state.isNeedReveal,
			currentGraph: state.currentGraph,
			hasUnsavedChanges: state.hasUnsavedChanges,
			selectedNodes: state.selectedNodes,
			selectNode: state.selectNode,
			setRevealPosition: state.setRevealPosition,
			updateNode: state.updateNode,
			markAsChanged: state.markAsChanged,
		})),
	);

	const changedPaths = useMemo(() => {
		// По умолчанию разрешаем редактирование всех полей
		return new Set(["*"]);
	}, []);

	const flatNodes = useMemo(() => {
		return flattenJsonData(jsonData, expandedPaths);
	}, [jsonData, expandedPaths]);

	// Автоматическая прокрутка к текущему результату поиска
	useEffect(() => {
		if (searchResults.length > 0 && currentSearchIndex >= 0) {
			const currentPath = searchResults[currentSearchIndex];
			const nodeIndex = flatNodes.findIndex(
				(node) => node.path === currentPath,
			);
			if (nodeIndex >= 0 && listRef.current) {
				listRef.current.scrollToItem(nodeIndex, "center");
			}
		}
	}, [searchResults, currentSearchIndex, flatNodes]);

	useEffect(() => {
		if (initialData) {
			isUpdatingFromStore.current = true;
			setJsonData(initialData);
			expandAll(initialData);
			isUpdatingFromStore.current = false;
		}
	}, [initialData, expandAll]);

	useEffect(() => {
		if (currentGraph && !isUpdatingFromStore.current) {
			isUpdatingFromStore.current = true;
			setJsonData(currentGraph);
			expandAll(currentGraph);
			isUpdatingFromStore.current = false;
		}
	}, [currentGraph, expandAll]);

	useEffect(() => {
		if (selectedNodes.length > 0 && currentGraph) {
			clearHighlights();
			selectedNodes.forEach((nodeId) => {
				const entityIndex = currentGraph.entities.findIndex(
					(e) => e.id === nodeId,
				);
				if (entityIndex >= 0) {
					const entityPath = `.entities.${entityIndex}`;
					addHighlight(entityPath);
				}
			});
		} else {
			clearHighlights();
		}
	}, [selectedNodes, currentGraph, addHighlight, clearHighlights]);

	const updateValue = useCallback(
		(path: string, value: any) => {
			// Сохраняем текущую позицию скролла
			const currentScrollOffset =
				(listRef.current as any)?._outerRef?.scrollTop || 0;

			const pathParts = path.split(".").filter(Boolean);

			// Создаем глубокую копию данных для безопасного изменения
			const newData = JSON.parse(JSON.stringify(jsonData));

			// Навигируем по пути и обновляем значение
			let current = newData;
			for (let i = 0; i < pathParts.length - 1; i++) {
				const part = pathParts[i];
				current = current[part];
			}
			const lastPart = pathParts[pathParts.length - 1];
			current[lastPart] = value;

			flushSync(() => {
				setJsonData(newData);
			});

			if (!isUpdatingFromStore.current) {
				onChange?.(newData);
			}

			// Обновляем store если изменяется сущность графа
			if (
				pathParts[0] === "entities" &&
				pathParts[1] !== undefined &&
				currentGraph
			) {
				const entityIndex = Number.parseInt(pathParts[1], 10);
				const entity = currentGraph.entities[entityIndex];

				if (entity) {
					// Для новой схемы данных мы просто помечаем как измененные
					// так как структура DataLineageEntity отличается от DataLineageNode
					if (!isInitializing) {
						markAsChanged();
					}
				}
			} else {
				// Для всех остальных изменений также помечаем как измененные
				if (!isInitializing) {
					markAsChanged();
				}
			}

			// Восстанавливаем позицию скролла после обновления
			setTimeout(() => {
				if (listRef.current && typeof currentScrollOffset === "number") {
					(listRef.current as any)?._outerRef?.scrollTo(0, currentScrollOffset);
				}
			}, 0);
		},
		[jsonData, onChange, currentGraph, updateNode, markAsChanged],
	);

	const handleNodeClick = useCallback(
		(path: string) => {
			const pathParts = path.split(".").filter(Boolean);
			if (pathParts[0] === "entities" && pathParts[1] !== undefined) {
				const entityIndex = Number.parseInt(pathParts[1], 10);
				const entity = currentGraph?.entities[entityIndex];
				if (entity) {
					selectNode(entity.id);
					setRevealPosition({ nodeId: entity.id, from: "editor" });
				}
			}
		},
		[currentGraph, selectNode, setRevealPosition],
	);

	const focusPath = useCallback(
		(path: string) => {
			setFocus(path);

			// Убираем ведущую точку для поиска в flatNodes
			const searchPath = path.startsWith(".") ? path.slice(1) : path;
			const nodeIndex = flatNodes.findIndex((node) => node.path === searchPath);

			if (nodeIndex < 0) {
				// Если точный путь не найден, попробуем найти первый дочерний элемент
				const childPath = `${searchPath}.`;
				const childIndex = flatNodes.findIndex((node) =>
					node.path.startsWith(childPath),
				);

				if (childIndex >= 0) {
					listRef.current?.scrollToItem(childIndex, "center");
					return;
				}
			}

			if (nodeIndex >= 0 && listRef.current) {
				listRef.current.scrollToItem(nodeIndex, "center");
			}
		},
		[setFocus, flatNodes],
	);

	useLayoutEffect(() => {
		if (revealPosition?.nodeId && currentGraph) {
			const entityIndex = currentGraph.entities.findIndex(
				(e) => e.id === revealPosition.nodeId,
			);

			if (entityIndex >= 0) {
				const entityPath = `.entities.${entityIndex}`;

				// Раскрываем родительские пути
				const pathParts = entityPath.split(".").filter(Boolean);
				let currentPath = "";
				for (const part of pathParts) {
					currentPath = currentPath ? `${currentPath}.${part}` : part;
					setExpanded(currentPath, true);
				}
			}
		}
	}, [isNeedReveal, revealPosition, currentGraph, setExpanded]);

	useLayoutEffect(() => {
		if (isNeedReveal("editor") && revealPosition?.nodeId && currentGraph) {
			const entityIndex = currentGraph.entities.findIndex(
				(e) => e.id === revealPosition.nodeId,
			);

			if (entityIndex >= 0) {
				const entityPath = `.entities.${entityIndex}`;

				// Добавляем небольшую задержку, чтобы узел успел развернуться
				setTimeout(() => {
					focusPath(entityPath);
				}, 100);
			}
		}
	}, [isNeedReveal, revealPosition, currentGraph, focusPath]);

	const _highlightPath = useCallback(
		(path: string) => {
			addHighlight(path);
		},
		[addHighlight],
	);

	const _unhighlightPath = useCallback(
		(path: string) => {
			removeHighlight(path);
		},
		[removeHighlight],
	);

	const _clearAllHighlights = useCallback(() => {
		clearHighlights();
	}, [clearHighlights]);

	const lineNumberMap = useMemo(() => {
		const map = new Map<string, number>();
		flatNodes.forEach((node, index) => {
			map.set(node.path, index + 1);
		});
		return map;
	}, [flatNodes]);

	const renderRow = useCallback(
		({ index, style }: { index: number; style: React.CSSProperties }) => {
			const node = flatNodes[index];
			if (!node) return null;

			const isHighlighted = Boolean(highlightedPaths[node.path]);
			const isFocused = focusedPath === node.path;
			const lineNumber = lineNumberMap.get(node.path) || index + 1;

			return (
				<div style={style} data-test-id={`json-row-${index}`}>
					<JsonNodeComponent
						node={node}
						lineNumber={lineNumber}
						onUpdate={updateValue}
						onToggleExpand={toggleExpanded}
						isHighlighted={isHighlighted}
						isFocused={isFocused}
						onNodeClick={handleNodeClick}
						isDark={mode === "dark"}
						selectedNodes={selectedNodes}
						currentGraph={currentGraph}
						changedPaths={changedPaths}
					/>
				</div>
			);
		},
		[
			flatNodes,
			highlightedPaths,
			focusedPath,
			updateValue,
			toggleExpanded,
			handleNodeClick,
			mode,
			selectedNodes,
			currentGraph,
			lineNumberMap,
			changedPaths,
		],
	);

	return (
		<Container ref={containerRef} data-test-id="json-editor-container">
			<JsonSearchBar data={jsonData} />
			<List
				ref={listRef}
				height={700}
				itemCount={flatNodes.length}
				itemSize={32}
				width="100%"
				data-test-id="json-editor-list"
			>
				{renderRow}
			</List>
		</Container>
	);
};
