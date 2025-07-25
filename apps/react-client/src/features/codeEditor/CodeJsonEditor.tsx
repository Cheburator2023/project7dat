import React, {
	useState,
	useCallback,
	useRef,
	useEffect,
	useLayoutEffect,
	forwardRef,
	useImperativeHandle,
	memo,
	useMemo,
} from "react";
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
}

const useJsonEditorStore = create<JsonEditorState>((set, get) => ({
	focusedPath: null,
	highlightedPaths: {},
	expandedPaths: { "": true, address: true, hobbies: true },
	editingPath: null,
	editValue: "",
	searchQuery: "",
	searchResults: [],
	currentSearchIndex: -1,
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
	return typeof value;
};

const formatValue = (value: any): string => {
	if (typeof value === "string") return `"${value}"`;
	if (value === null) return "null";
	return String(value);
};

const parseEditValue = (editValue: string): any => {
	if (editValue === "true" || editValue === "false") {
		return editValue === "true";
	}
	if (!Number.isNaN(Number(editValue)) && editValue.trim() !== "") {
		return Number(editValue);
	}
	if (editValue === "null") {
		return null;
	}
	return editValue;
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
			},
		];
	}

	const isArray = Array.isArray(data);
	const entries = isArray
		? data.map((item, index) => [index, item])
		: Object.entries(data);

	if (path === "" && expandedPaths[""]) {
		entries.forEach(([key, value], index) => {
			const currentPath = String(key);
			const isLast = index === entries.length - 1;
			const isExpandable = !isPrimitive(value);
			const isExpanded = Boolean(expandedPaths[currentPath]);

			result.push({
				path: currentPath,
				key,
				value,
				depth,
				isLast,
				isExpandable,
				isExpanded,
				parentPath: "",
			});

			if (isExpandable && isExpanded) {
				result.push(
					...flattenJsonData(value, expandedPaths, currentPath, depth + 1),
				);
			}
		});
	} else if (path !== "") {
		entries.forEach(([key, value], index) => {
			const currentPath = `${path}.${key}`;
			const isLast = index === entries.length - 1;
			const isExpandable = !isPrimitive(value);
			const isExpanded = Boolean(expandedPaths[currentPath]);

			result.push({
				path: currentPath,
				key,
				value,
				depth,
				isLast,
				isExpandable,
				isExpanded,
				parentPath: path,
			});

			if (isExpandable && isExpanded) {
				result.push(
					...flattenJsonData(value, expandedPaths, currentPath, depth + 1),
				);
			}
		});
	}

	return result;
};

const SearchContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1),
	padding: theme.spacing(1),
	borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SearchField = styled(TextField)(({ theme }) => ({
	flex: 1,
	"& .MuiOutlinedInput-root": {
		height: "32px",
		fontSize: "14px",
	},
}));

const SearchResults = styled(Typography)(({ theme }) => ({
	fontSize: "12px",
	color: theme.palette.text.secondary,
	minWidth: "80px",
	textAlign: "center",
}));

const Container = styled(Box)(({ theme }) => ({
	fontFamily: 'Monaco, "Lucida Console", monospace',
	fontSize: "14px",
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius,
	overflow: "hidden",
	display: "flex",
	flexDirection: "column",
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

const KeyText = styled(Typography)<{ $isDark?: boolean }>(
	({ theme, $isDark }) => ({
		color: $isDark ? theme.palette.primary.light : theme.palette.primary.main,
		fontWeight: "bold",
		marginRight: theme.spacing(1),
	}),
);

const ValueText = styled(Typography, {
	shouldForwardProp: (prop) => !prop.toString().startsWith("$"),
})<{ $type: string; $isDark?: boolean }>(({ theme, $type, $isDark }) => ({
	color:
		$type === "string"
			? $isDark
				? theme.palette.success.light
				: theme.palette.success.main
			: $type === "number"
				? $isDark
					? theme.palette.info.light
					: theme.palette.info.main
				: $type === "boolean"
					? $isDark
						? theme.palette.warning.light
						: theme.palette.warning.main
					: theme.palette.text.primary,
	cursor: "pointer",
	padding: theme.spacing(0.5, 1),
	borderRadius: theme.shape.borderRadius,
	flex: 1,
	minWidth: 0,
	"&:hover": {
		backgroundColor: theme.palette.action.hover,
	},
	transition: "background-color 0.2s ease",
}));

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
}

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

		const { revealPosition, isNeedReveal, currentGraph } = useDataLineageStore(
			useShallow((state) => ({
				revealPosition: state.revealPosition,
				isNeedReveal: state.isNeedReveal,
				currentGraph: state.currentGraph,
			})),
		);

		const isEditing = editingPath === node.path;
		const isSearchMatch = searchResults.includes(node.path);
		const isCurrentSearchResult =
			searchResults[currentSearchIndex] === node.path;

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

		useEffect(() => {
			if (revealPosition.nodeId && nodeRef.current) {
				const nodeIndex = currentGraph?.nodes.findIndex(
					(n) => n.id === revealPosition.nodeId,
				);
				if (nodeIndex !== undefined && nodeIndex >= 0) {
					const targetPath = `.nodes.${nodeIndex}`;
					if (node.path === targetPath) {
						nodeRef.current.scrollIntoView({
							behavior: "smooth",
							block: "center",
						});
					}
				}
			}
		}, [revealPosition, isNeedReveal, currentGraph, node.path]);

		const handleEdit = useCallback(
			(value: any) => {
				startEditing(node.path, String(value));
			},
			[node.path, startEditing],
		);

		const handleSave = useCallback(() => {
			const parsedValue = parseEditValue(editValue);
			onUpdate(node.path, parsedValue);
			stopEditing();
		}, [editValue, onUpdate, node.path, stopEditing]);

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

		if (!node.isExpandable) {
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
						{node.key !== "" && (
							<KeyText
								$isDark={isDark}
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
									data-test-id={`json-input-${node.path.replace(/\./g, "-")}`}
								/>
								<EditActions>
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											handleSave();
										}}
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
									onClick={(e) => {
										e.stopPropagation();
										handleEdit(node.value);
									}}
									data-test-id={`json-value-${node.path.replace(/\./g, "-")}`}
								>
									{formatValue(node.value)}
								</ValueText>
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
							</ValueContainer>
						)}
					</ContentColumn>
				</JsonLine>
			);
		}

		const isArray = Array.isArray(node.value);
		const entries = isArray
			? node.value.map((item: any, index: number) => [index, item])
			: Object.entries(node.value);

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
					{node.key !== "" && (
						<KeyText
							$isDark={isDark}
							data-test-id={`json-key-${node.path.replace(/\./g, "-")}`}
						>
							"{node.key}":
						</KeyText>
					)}
					<Typography>{isArray ? "[" : "{"}</Typography>
					{!node.isExpanded && (
						<Typography
							sx={{ ml: 1, color: "text.secondary" }}
							data-test-id={`json-collapsed-info-${node.path.replace(/\./g, "-")}`}
						>
							...{entries.length} {isArray ? "элементов" : "свойств"}
						</Typography>
					)}
					{!node.isExpanded && <Typography>{isArray ? "]" : "}"}</Typography>}
					{!node.isLast && !node.isExpanded && <Typography>,</Typography>}
				</ContentColumn>
			</JsonLine>
		);
	},
);

interface CodeJsonEditorProps {
	initialData?: any;
	onChange?: (data: any) => void;
}

interface CodeJsonEditorRef {
	focusPath: (path: string) => void;
	highlightPath: (path: string) => void;
	unhighlightPath: (path: string) => void;
	clearAllHighlights: () => void;
	getData: () => any;
	setData: (data: any) => void;
}

export const CodeJsonEditor = forwardRef<
	CodeJsonEditorRef,
	CodeJsonEditorProps
>(
	(
		{
			initialData = {
				name: "Пример",
				age: 25,
				active: true,
				address: {
					city: "Москва",
					country: "Россия",
				},
				hobbies: ["чтение", "программирование"],
			},
			onChange,
		},
		ref,
	) => {
		const { mode } = useColorScheme();
		const [jsonData, setJsonData] = useState(initialData);
		const containerRef = useRef<HTMLDivElement>(null);
		const listRef = useRef<List>(null);

		const {
			focusedPath,
			highlightedPaths,
			expandedPaths,
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

		const {
			revealPosition,
			isNeedReveal,
			currentGraph,
			selectedNodes,
			selectNode,
			setRevealPosition,
		} = useDataLineageStore(
			useShallow((state) => ({
				revealPosition: state.revealPosition,
				isNeedReveal: state.isNeedReveal,
				currentGraph: state.currentGraph,
				selectedNodes: state.selectedNodes,
				selectNode: state.selectNode,
				setRevealPosition: state.setRevealPosition,
			})),
		);

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
				setJsonData(initialData);
				expandAll(initialData);
			}
		}, [initialData, expandAll]);

		useEffect(() => {
			if (selectedNodes.length > 0 && currentGraph) {
				clearHighlights();
				selectedNodes.forEach((nodeId) => {
					const nodeIndex = currentGraph.nodes.findIndex(
						(n) => n.id === nodeId,
					);
					if (nodeIndex >= 0) {
						const nodePath = `.nodes.${nodeIndex}`;
						addHighlight(nodePath);
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

				const newData = produce(jsonData, (draft: any) => {
					let current = draft;
					for (let i = 0; i < pathParts.length - 1; i++) {
						const part = pathParts[i];
						current = current[part];
					}
					const lastPart = pathParts[pathParts.length - 1];
					current[lastPart] = value;
				});

				setJsonData(newData);
				onChange?.(newData);

				// Восстанавливаем позицию скролла после обновления
				setTimeout(() => {
					if (listRef.current && typeof currentScrollOffset === "number") {
						(listRef.current as any)?._outerRef?.scrollTo(
							0,
							currentScrollOffset,
						);
					}
				}, 0);
			},
			[jsonData, onChange],
		);

		const handleNodeClick = useCallback(
			(path: string) => {
				const pathParts = path.split(".").filter(Boolean);
				if (pathParts[0] === "nodes" && pathParts[1] !== undefined) {
					const nodeIndex = Number.parseInt(pathParts[1], 10);
					const node = currentGraph?.nodes[nodeIndex];
					if (node) {
						selectNode(node.id);
						setRevealPosition({ nodeId: node.id, from: "editor" });
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
				const nodeIndex = flatNodes.findIndex(
					(node) => node.path === searchPath,
				);

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
				const nodeIndex = currentGraph.nodes.findIndex(
					(n) => n.id === revealPosition.nodeId,
				);

				if (nodeIndex >= 0) {
					const nodePath = `.nodes.${nodeIndex}`;

					// Раскрываем родительские пути
					const pathParts = nodePath.split(".").filter(Boolean);
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
				const nodeIndex = currentGraph.nodes.findIndex(
					(n) => n.id === revealPosition.nodeId,
				);

				if (nodeIndex >= 0) {
					const nodePath = `.nodes.${nodeIndex}`;

					// Добавляем небольшую задержку, чтобы узел успел развернуться
					setTimeout(() => {
						focusPath(nodePath);
					}, 100);
				}
			}
		}, [isNeedReveal, revealPosition, currentGraph, focusPath]);

		const highlightPath = useCallback(
			(path: string) => {
				addHighlight(path);
			},
			[addHighlight],
		);

		const unhighlightPath = useCallback(
			(path: string) => {
				removeHighlight(path);
			},
			[removeHighlight],
		);

		const clearAllHighlights = useCallback(() => {
			clearHighlights();
		}, [clearHighlights]);

		useImperativeHandle(
			ref,
			() => ({
				focusPath,
				highlightPath,
				unhighlightPath,
				clearAllHighlights,
				getData: () => jsonData,
				setData: setJsonData,
			}),
			[focusPath, highlightPath, unhighlightPath, clearAllHighlights, jsonData],
		);

		const renderRow = useCallback(
			({ index, style }: { index: number; style: React.CSSProperties }) => {
				const node = flatNodes[index];
				if (!node) return null;

				const isHighlighted = Boolean(highlightedPaths[node.path]);
				const isFocused = focusedPath === node.path;

				return (
					<div style={style} data-test-id={`json-row-${index}`}>
						<JsonNodeComponent
							node={node}
							lineNumber={index + 1}
							onUpdate={updateValue}
							onToggleExpand={toggleExpanded}
							isHighlighted={isHighlighted}
							isFocused={isFocused}
							onNodeClick={handleNodeClick}
							isDark={mode === "dark"}
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
			],
		);

		return (
			<Container ref={containerRef} data-test-id="json-editor-container">
				<JsonSearchBar data={jsonData} />
				<List
					ref={listRef}
					height={600}
					itemCount={flatNodes.length}
					itemSize={32}
					width="100%"
					data-test-id="json-editor-list"
				>
					{renderRow}
				</List>
			</Container>
		);
	},
);
