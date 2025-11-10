import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { styled, alpha, useColorScheme } from "@mui/material/styles";
import { TextField, IconButton, Box, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { FixedSizeList as List } from "react-window";
import { create } from "zustand";
import { produce } from "immer";

interface JsonViewerState {
	expandedPaths: Record<string, boolean>;
	searchQuery: string;
	searchResults: string[];
	currentSearchIndex: number;
	toggleExpanded: (path: string) => void;
	setExpanded: (path: string, expanded: boolean) => void;
	isExpanded: (path: string) => boolean;
	expandAll: (data: any) => void;
	collapseAll: () => void;
	setSearchQuery: (query: string) => void;
	searchInData: (data: any, query: string) => void;
	clearSearch: () => void;
	goToNextResult: () => void;
	goToPrevResult: () => void;
}

const useJsonViewerStore = create<JsonViewerState>((set, get) => ({
	expandedPaths: { "": true },
	searchQuery: "",
	searchResults: [],
	currentSearchIndex: -1,
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
	collapseAll: () => set({ expandedPaths: { "": true } }),
	setSearchQuery: (query) => set({ searchQuery: query }),
	searchInData: (data, query) => {
		if (!query.trim()) {
			set({ searchResults: [], currentSearchIndex: -1 });
			return;
		}
		const results = searchInJsonData(data, query.toLowerCase());

		if (results.length > 0) {
			const { expandedPaths } = get();
			const newExpandedPaths = { ...expandedPaths };

			results.forEach((resultPath) => {
				const pathParts = resultPath.split(".");
				for (let i = 0; i < pathParts.length; i++) {
					const parentPath = pathParts.slice(0, i).join(".");
					if (parentPath !== "") {
						newExpandedPaths[parentPath] = true;
					}
				}
			});

			set({
				searchResults: results,
				currentSearchIndex: 0,
				expandedPaths: newExpandedPaths,
			});
		} else {
			set({
				searchResults: results,
				currentSearchIndex: -1,
			});
		}
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

		if (keyString.includes(query)) {
			results.push(currentPath);
		}

		if (isPrimitive(value)) {
			const stringValue = String(value).toLowerCase();
			if (stringValue.includes(query)) {
				results.push(currentPath);
			}
		} else {
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

	if (path === "" && expandedPaths[""]) {
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

			const parentPathParts = path.split(".");
			const parentKey = parentPathParts[parentPathParts.length - 1];
			const grandParentPath = parentPathParts.slice(0, -1).join(".");

			let isLastInParent = true;
			if (grandParentPath !== "" || parentPathParts.length === 1) {
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

const SearchField = styled(TextField)(() => ({}));

const SearchResults = styled(Typography)(({ theme }) => ({
	fontSize: "12px",
	color: theme.palette.text.secondary,
	minWidth: "80px",
	textAlign: "center",
}));

const Container = styled(Box)(() => ({
	fontFamily: 'Monaco, "Lucida Console", monospace',
	overflow: "hidden",
	display: "flex",
	flexDirection: "column",
	zoom: 0.8,
}));

const JsonLine = styled(Box, {
	shouldForwardProp: (prop) => !prop.toString().startsWith("$"),
})<{
	$depth: number;
	$isSearchMatch?: boolean;
	$isCurrentSearchResult?: boolean;
	$isDark?: boolean;
	"data-path"?: string;
}>(({ theme, $depth, $isSearchMatch, $isCurrentSearchResult, $isDark }) => ({
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
			: "transparent",
	"&:hover": {
		backgroundColor: theme.palette.action.hover,
	},
	transition: "background-color 0.2s ease",
	cursor: "pointer",
}));

const LineNumberColumn = styled(Box, {
	shouldForwardProp: (prop) => !prop.toString().startsWith("$"),
})<{ $isDark?: boolean }>(({ theme, $isDark }) => ({
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
}));

const ContentColumn = styled(Box, {
	shouldForwardProp: (prop) => !prop.toString().startsWith("$"),
})<{ $depth: number }>(({ theme, $depth }) => ({
	flex: 1,
	display: "flex",
	alignItems: "center",
	paddingLeft: theme.spacing($depth * 2 + 1),
	minHeight: "32px",
	height: "32px",
}));

const KeyText = styled(Typography, {
	shouldForwardProp: (prop) => !prop.toString().startsWith("$"),
})<{ $isDark?: boolean }>(({ theme, $isDark }) => ({
	color: $isDark ? theme.palette.primary.light : theme.palette.primary.main,
	fontWeight: "bold",
	marginRight: theme.spacing(1),
}));

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
		padding: theme.spacing(0.5, 1),
		borderRadius: theme.shape.borderRadius,
		flex: 1,
		minWidth: 0,
		transition: "background-color 0.2s ease, color 0.2s ease",
	};
});

const ValueContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	flex: 1,
	minWidth: 0,
	gap: theme.spacing(0.5),
}));

const JsonSyntax = styled("span")(({ theme }) => ({
	color: theme.palette.warning.main,
	fontWeight: "bold",
	fontSize: "16px",
}));

interface JsonSearchBarProps {
	data: any;
	onScrollToResult?: (index: number) => void;
}

const JsonSearchBar: React.FC<JsonSearchBarProps> = ({
	data,
	onScrollToResult,
}) => {
	const {
		searchQuery,
		searchResults,
		currentSearchIndex,
		setSearchQuery,
		searchInData,
		clearSearch,
		goToNextResult,
		goToPrevResult,
	} = useJsonViewerStore();

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const query = event.target.value;
		setSearchQuery(query);
		searchInData(data, query);
	};

	const handleClearSearch = () => {
		clearSearch();
	};

	const handleNextResult = useCallback(() => {
		goToNextResult();
		if (onScrollToResult) {
			onScrollToResult(currentSearchIndex);
		}
	}, [goToNextResult, onScrollToResult, currentSearchIndex]);

	const handlePrevResult = useCallback(() => {
		goToPrevResult();
		if (onScrollToResult) {
			onScrollToResult(currentSearchIndex);
		}
	}, [goToPrevResult, onScrollToResult, currentSearchIndex]);

	return (
		<SearchContainer>
			<SearchField
				size="small"
				placeholder="Поиск в JSON..."
				value={searchQuery}
				onChange={handleSearchChange}
				InputProps={{
					startAdornment: <SearchIcon fontSize="small" />,
					endAdornment: searchQuery && (
						<IconButton size="small" onClick={handleClearSearch}>
							<ClearIcon fontSize="small" />
						</IconButton>
					),
				}}
			/>
			{searchResults.length > 0 && (
				<>
					<SearchResults>
						{currentSearchIndex + 1} из {searchResults.length}
					</SearchResults>
					<IconButton size="small" onClick={handlePrevResult}>
						<KeyboardArrowUpIcon fontSize="small" />
					</IconButton>
					<IconButton size="small" onClick={handleNextResult}>
						<KeyboardArrowDownIcon fontSize="small" />
					</IconButton>
				</>
			)}
		</SearchContainer>
	);
};

interface JsonLineItemProps {
	node: FlatJsonNode;
	lineNumber: number;
	isDark: boolean;
	searchResults: string[];
	currentSearchIndex: number;
	onToggleExpanded: (path: string) => void;
}

const JsonLineItem: React.FC<JsonLineItemProps> = ({
	node,
	lineNumber,
	isDark,
	searchResults,
	currentSearchIndex,
	onToggleExpanded,
}) => {
	const isSearchMatch = searchResults.includes(node.path);
	const isCurrentSearchResult =
		currentSearchIndex >= 0 && searchResults[currentSearchIndex] === node.path;

	const handleToggleExpanded = useCallback(() => {
		if (node.isExpandable) {
			onToggleExpanded(node.path);
		}
	}, [node.isExpandable, node.path, onToggleExpanded]);

	if (node.nodeType === "opening" || node.nodeType === "closing") {
		return (
			<JsonLine
				$depth={node.depth}
				$isSearchMatch={isSearchMatch}
				$isCurrentSearchResult={isCurrentSearchResult}
				$isDark={isDark}
				data-path={node.path}
			>
				<LineNumberColumn $isDark={isDark}>{lineNumber}</LineNumberColumn>
				<ContentColumn $depth={node.depth}>
					<JsonSyntax>{node.syntaxElement}</JsonSyntax>
					{!node.isLast && <JsonSyntax>,</JsonSyntax>}
				</ContentColumn>
			</JsonLine>
		);
	}

	return (
		<JsonLine
			$depth={node.depth}
			$isSearchMatch={isSearchMatch}
			$isCurrentSearchResult={isCurrentSearchResult}
			$isDark={isDark}
			data-path={node.path}
		>
			<LineNumberColumn $isDark={isDark}>{lineNumber}</LineNumberColumn>
			<ContentColumn $depth={node.depth}>
				{node.isExpandable && (
					<IconButton
						size="small"
						onClick={handleToggleExpanded}
						sx={{ padding: 0.5, marginRight: 0.5 }}
					>
						{node.isExpanded ? (
							<ExpandLess fontSize="small" />
						) : (
							<ExpandMore fontSize="small" />
						)}
					</IconButton>
				)}
				{!node.isArrayElement && (
					<KeyText $isDark={isDark}>
						{typeof node.key === "string" ? `"${node.key}"` : node.key}:
					</KeyText>
				)}
				<ValueContainer>
					{node.showInlineOpeningBrace && (
						<JsonSyntax>{Array.isArray(node.value) ? "[" : "{"}</JsonSyntax>
					)}
					{!node.isExpandable && (
						<ValueText $type={getValueType(node.value)} $isDark={isDark}>
							{formatValue(node.value)}
						</ValueText>
					)}
					{!node.isLast && <JsonSyntax>,</JsonSyntax>}
				</ValueContainer>
			</ContentColumn>
		</JsonLine>
	);
};

export interface JsonViewerProps {
	data: any;
	height?: number;
	showSearch?: boolean;
	className?: string;
}
/*
 * JsonViewer - компонент для отображения JSON данных с возможностью поиска и раскрытия вложенных элементов.
 *
 * @param {any} data - JSON данные для отображения.
 * @param {number} [height=400] - Высота компонента в пикселях.
 * @param {boolean} [showSearch=true] - Показывать ли строку поиска.
 * @param {string} [className] - Дополнительный класс для стилизации компонента.
 */
export const JsonViewer: React.FC<JsonViewerProps> = ({
	data,
	height = 400,
	showSearch = true,
	className,
}) => {
	const { mode } = useColorScheme();
	const isDark = mode === "dark";
	const listRef = useRef<List>(null);

	const {
		expandedPaths,
		searchResults,
		currentSearchIndex,
		toggleExpanded,
		searchInData,
		searchQuery,
	} = useJsonViewerStore();

	const flattenedData = useMemo(() => {
		if (!data) return [];
		return flattenJsonData(data, expandedPaths);
	}, [data, expandedPaths]);

	const scrollToSearchResult = useCallback(
		(searchIndex: number) => {
			if (searchResults.length === 0 || searchIndex < 0) return;

			const targetPath = searchResults[searchIndex];
			const nodeIndex = flattenedData.findIndex(
				(node) => node.path === targetPath,
			);

			if (nodeIndex >= 0 && listRef.current) {
				listRef.current.scrollToItem(nodeIndex, "center");
			}
		},
		[searchResults, flattenedData],
	);

	useEffect(() => {
		if (currentSearchIndex >= 0 && searchResults.length > 0) {
			scrollToSearchResult(currentSearchIndex);
		}
	}, [currentSearchIndex, searchResults, scrollToSearchResult]);

	React.useEffect(() => {
		if (searchQuery && data) {
			searchInData(data, searchQuery);
		}
	}, [data, searchQuery, searchInData]);

	const renderItem = useCallback(
		({ index, style }: { index: number; style: React.CSSProperties }) => {
			const node = flattenedData[index];
			return (
				<div style={style}>
					<JsonLineItem
						node={node}
						lineNumber={index + 1}
						isDark={isDark}
						searchResults={searchResults}
						currentSearchIndex={currentSearchIndex}
						onToggleExpanded={toggleExpanded}
					/>
				</div>
			);
		},
		[flattenedData, isDark, searchResults, currentSearchIndex, toggleExpanded],
	);

	if (!data) {
		return (
			<Container className={className}>
				<Box
					display="flex"
					alignItems="center"
					justifyContent="center"
					height={height}
				>
					<Typography color="text.secondary">
						Нет данных для отображения
					</Typography>
				</Box>
			</Container>
		);
	}

	return (
		<Container className={className}>
			{showSearch && (
				<JsonSearchBar data={data} onScrollToResult={scrollToSearchResult} />
			)}
			<List
				ref={listRef}
				height={height - (showSearch ? 60 : 0)}
				itemCount={flattenedData.length}
				itemSize={32}
				width="100%"
			>
				{renderItem}
			</List>
		</Container>
	);
};

export { useJsonViewerStore };
