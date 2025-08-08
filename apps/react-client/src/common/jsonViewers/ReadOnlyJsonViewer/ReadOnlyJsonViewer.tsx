import React, { useCallback, useRef, useMemo, memo, useEffect } from "react";
import { styled, useColorScheme } from "@mui/material/styles";
import { TextField, IconButton, Box, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { create } from "zustand";
import { produce } from "immer";
import { FixedSizeList as List } from "react-window";

interface ReadOnlyJsonViewerState {
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

export const useReadOnlyJsonViewerStore = create<ReadOnlyJsonViewerState>(
	(set, get) => ({
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
				return nextIndex;
			}
			return -1;
		},
		goToPrevResult: () => {
			const { searchResults, currentSearchIndex } = get();
			if (searchResults.length > 0) {
				const prevIndex =
					currentSearchIndex <= 0
						? searchResults.length - 1
						: currentSearchIndex - 1;
				set({ currentSearchIndex: prevIndex });
				return prevIndex;
			}
			return -1;
		},
	}),
);

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

	const isExpanded = Boolean(expandedPaths[path]);

	if (path !== "") {
		result.push({
			path,
			key: path.split(".").pop() || "",
			value: data,
			depth,
			isLast: false,
			isExpandable: true,
			isExpanded,
			parentPath: path.split(".").slice(0, -1).join("."),
			nodeType: "opening",
			syntaxElement: isArray ? "[" : "{",
			showInlineOpeningBrace: !isExpanded && entries.length === 0,
		});
	}

	if (isExpanded || path === "") {
		entries.forEach(([key, value], index) => {
			const currentPath = path === "" ? String(key) : `${path}.${key}`;
			const isLast = index === entries.length - 1;

			if (isPrimitive(value)) {
				result.push({
					path: currentPath,
					key,
					value,
					depth: path === "" ? depth : depth + 1,
					isLast,
					isExpandable: false,
					isExpanded: false,
					parentPath: path,
					nodeType: "property",
					isArrayElement: isArray,
				});
			} else {
				result.push(
					...flattenJsonData(
						value,
						expandedPaths,
						currentPath,
						path === "" ? depth : depth + 1,
					),
				);
			}
		});

		if (path !== "" && entries.length > 0) {
			result.push({
				path: `${path}.__closing__`,
				key: "",
				value: null,
				depth,
				isLast: true,
				isExpandable: false,
				isExpanded: false,
				parentPath: path,
				nodeType: "closing",
				syntaxElement: isArray ? "]" : "}",
			});
		}
	}

	return result;
};

const Container = styled(Box)(({ theme }) => ({
	fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
	fontSize: "14px",
	lineHeight: "1.4",
	backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#ffffff",
	color: theme.palette.mode === "dark" ? "#d4d4d4" : "#333333",
	border: `1px solid ${theme.palette.mode === "dark" ? "#3e3e3e" : "#e0e0e0"}`,
	borderRadius: "8px",
	overflow: "hidden",
	position: "relative",
}));

const SearchContainer = styled(Box)(({ theme }) => ({
	padding: "8px 12px",
	borderBottom: `1px solid ${theme.palette.mode === "dark" ? "#3e3e3e" : "#e0e0e0"}`,
	backgroundColor: theme.palette.mode === "dark" ? "#252526" : "#f8f8f8",
	display: "flex",
	alignItems: "center",
	gap: "8px",
}));

const NodeContainer = styled(Box, {
	shouldForwardProp: (prop) => prop !== "isHighlighted",
})<{ depth: number; isHighlighted?: boolean }>(
	({ theme, depth, isHighlighted }) => ({
		paddingLeft: `${depth * 20 + 8}px`,
		paddingRight: "8px",
		paddingTop: "2px",
		paddingBottom: "2px",
		display: "flex",
		alignItems: "center",
		minHeight: "28px",
		backgroundColor: isHighlighted
			? theme.palette.mode === "dark"
				? "#3a3d41"
				: "#e8f4fd"
			: "transparent",
		"&:hover": {
			backgroundColor: theme.palette.mode === "dark" ? "#2a2d2e" : "#f5f5f5",
		},
	}),
);

interface JsonNodeProps {
	node: FlatJsonNode;
	onToggleExpand: (path: string) => void;
	isHighlighted?: boolean;
	isDark: boolean;
}

const JsonNodeComponent = memo<JsonNodeProps>(
	({ node, onToggleExpand, isHighlighted, isDark }) => {
		const handleToggle = useCallback(() => {
			if (node.isExpandable) {
				onToggleExpand(node.path);
			}
		}, [node.path, node.isExpandable, onToggleExpand]);

		const getValueColor = (value: any) => {
			if (value === null) return isDark ? "#569cd6" : "#0000ff";
			if (typeof value === "string") return isDark ? "#ce9178" : "#a31515";
			if (typeof value === "number") return isDark ? "#b5cea8" : "#098658";
			if (typeof value === "boolean") return isDark ? "#569cd6" : "#0000ff";
			return isDark ? "#d4d4d4" : "#333333";
		};

		const getKeyColor = () => (isDark ? "#9cdcfe" : "#0451a5");
		const getSyntaxColor = () => (isDark ? "#d4d4d4" : "#333333");

		if (node.nodeType === "opening") {
			const isEmpty = node.showInlineOpeningBrace;
			return (
				<NodeContainer depth={node.depth} isHighlighted={isHighlighted}>
					<IconButton
						size="small"
						onClick={handleToggle}
						sx={{ width: 16, height: 16, marginRight: "4px" }}
					>
						{node.isExpanded ? (
							<ExpandLess sx={{ fontSize: 16 }} />
						) : (
							<ExpandMore sx={{ fontSize: 16 }} />
						)}
					</IconButton>
					<Typography
						component="span"
						sx={{ color: getKeyColor(), fontWeight: "bold" }}
					>
						{node.key}
					</Typography>
					<Typography component="span" sx={{ color: getSyntaxColor() }}>
						: {node.syntaxElement}
						{isEmpty && (node.syntaxElement === "[" ? "]" : "}")}
					</Typography>
				</NodeContainer>
			);
		}

		if (node.nodeType === "closing") {
			return (
				<NodeContainer depth={node.depth} isHighlighted={isHighlighted}>
					<Box sx={{ width: 20 }} />
					<Typography component="span" sx={{ color: getSyntaxColor() }}>
						{node.syntaxElement}
					</Typography>
				</NodeContainer>
			);
		}

		return (
			<NodeContainer depth={node.depth} isHighlighted={isHighlighted}>
				<Box sx={{ width: 20 }} />
				{!node.isArrayElement && (
					<>
						<Typography
							component="span"
							sx={{ color: getKeyColor(), fontWeight: "bold" }}
						>
							{node.key}
						</Typography>
						<Typography component="span" sx={{ color: getSyntaxColor() }}>
							:{" "}
						</Typography>
					</>
				)}
				<Typography component="span" sx={{ color: getValueColor(node.value) }}>
					{formatValue(node.value)}
				</Typography>
			</NodeContainer>
		);
	},
);

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
	} = useReadOnlyJsonViewerStore();

	const handleSearchChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const query = event.target.value;
			setSearchQuery(query);
			searchInData(data, query);
		},
		[data, setSearchQuery, searchInData],
	);

	const handleClearSearch = useCallback(() => {
		clearSearch();
	}, [clearSearch]);

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
			<TextField
				size="small"
				placeholder="Поиск в JSON..."
				value={searchQuery}
				onChange={handleSearchChange}
				InputProps={{
					startAdornment: <SearchIcon sx={{ fontSize: 16, mr: 1 }} />,
					endAdornment: searchQuery && (
						<IconButton size="small" onClick={handleClearSearch}>
							<ClearIcon sx={{ fontSize: 16 }} />
						</IconButton>
					),
				}}
				sx={{ flex: 1 }}
			/>
			{searchResults.length > 0 && (
				<>
					<Typography variant="caption">
						{currentSearchIndex + 1} из {searchResults.length}
					</Typography>
					<IconButton size="small" onClick={handlePrevResult}>
						<KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
					</IconButton>
					<IconButton size="small" onClick={handleNextResult}>
						<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
					</IconButton>
				</>
			)}
		</SearchContainer>
	);
};

export interface ReadOnlyJsonViewerProps {
	data: any;
	height?: number;
	showSearch?: boolean;
}

export const ReadOnlyJsonViewer: React.FC<ReadOnlyJsonViewerProps> = ({
	data,
	height = 400,
	showSearch = true,
}) => {
	const { mode } = useColorScheme();
	const listRef = useRef<List>(null);

	const {
		expandedPaths,
		searchResults,
		currentSearchIndex,
		toggleExpanded,
		expandAll,
		collapseAll,
	} = useReadOnlyJsonViewerStore();

	const flatNodes = useMemo(() => {
		if (!data) return [];
		return flattenJsonData(data, expandedPaths);
	}, [data, expandedPaths]);

	const scrollToSearchResult = useCallback(
		(searchIndex: number) => {
			if (searchResults.length === 0 || searchIndex < 0) return;

			const targetPath = searchResults[searchIndex];
			const nodeIndex = flatNodes.findIndex((node) => node.path === targetPath);

			if (nodeIndex >= 0 && listRef.current) {
				listRef.current.scrollToItem(nodeIndex, "center");
			}
		},
		[searchResults, flatNodes],
	);

	useEffect(() => {
		if (currentSearchIndex >= 0 && searchResults.length > 0) {
			scrollToSearchResult(currentSearchIndex);
		}
	}, [currentSearchIndex, searchResults, scrollToSearchResult]);

	const renderRow = useCallback(
		({ index, style }: { index: number; style: React.CSSProperties }) => {
			const node = flatNodes[index];
			if (!node) return null;

			const isHighlighted =
				searchResults.length > 0 &&
				currentSearchIndex >= 0 &&
				searchResults[currentSearchIndex] === node.path;

			return (
				<div style={style}>
					<JsonNodeComponent
						node={node}
						onToggleExpand={toggleExpanded}
						isHighlighted={isHighlighted}
						isDark={mode === "dark"}
					/>
				</div>
			);
		},
		[flatNodes, searchResults, currentSearchIndex, toggleExpanded, mode],
	);

	if (!data) {
		return (
			<Container>
				<Box sx={{ p: 2, textAlign: "center" }}>
					<Typography variant="body2" color="text.secondary">
						Нет данных для отображения
					</Typography>
				</Box>
			</Container>
		);
	}

	return (
		<Container>
			{showSearch && (
				<JsonSearchBar data={data} onScrollToResult={scrollToSearchResult} />
			)}
			<Box sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider" }}>
				<IconButton size="small" onClick={() => expandAll(data)} sx={{ mr: 1 }}>
					<Typography variant="caption">Развернуть все</Typography>
				</IconButton>
				<IconButton size="small" onClick={collapseAll}>
					<Typography variant="caption">Свернуть все</Typography>
				</IconButton>
			</Box>
			<List
				ref={listRef}
				height={height}
				itemCount={flatNodes.length}
				itemSize={32}
				width="100%"
			>
				{renderRow}
			</List>
		</Container>
	);
};
