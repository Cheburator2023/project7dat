import React, {
	useState,
	useCallback,
	useRef,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from "react";
import { styled } from "@mui/material/styles";
import { Box, TextField, Typography, IconButton } from "@mui/material";
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

interface JsonEditorState {
	focusedPath: string | null;
	highlightedPaths: Set<string>;
	setFocus: (path: string | null) => void;
	addHighlight: (path: string) => void;
	removeHighlight: (path: string) => void;
	clearHighlights: () => void;
}

const useJsonEditorStore = create<JsonEditorState>((set) => ({
	focusedPath: null,
	highlightedPaths: new Set(),
	setFocus: (path) => set({ focusedPath: path }),
	addHighlight: (path) =>
		set((state) => ({
			highlightedPaths: new Set([...state.highlightedPaths, path]),
		})),
	removeHighlight: (path) =>
		set((state) => {
			const newHighlights = new Set(state.highlightedPaths);
			newHighlights.delete(path);
			return { highlightedPaths: newHighlights };
		}),
	clearHighlights: () => set({ highlightedPaths: new Set() }),
}));

const Container = styled(Box)(({ theme }) => ({
	fontFamily: 'Monaco, "Lucida Console", monospace',
	fontSize: "14px",
	lineHeight: "1.4",
	padding: theme.spacing(2),
	backgroundColor: theme.palette.background.paper,
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius,
	maxHeight: "600px",
	overflow: "auto",
}));

const JsonLine = styled(Box)<{
	$isHighlighted?: boolean;
	$isFocused?: boolean;
	$depth: number;
	"data-path"?: string;
}>(({ theme, $isHighlighted, $isFocused, $depth }) => ({
	display: "flex",
	alignItems: "center",
	paddingLeft: $depth * 20,
	minHeight: "24px",
	backgroundColor: $isFocused
		? theme.palette.primary.light
		: $isHighlighted
			? theme.palette.warning.light
			: "transparent",
	"&:hover": {
		backgroundColor: theme.palette.action.hover,
	},
	transition: "background-color 0.2s ease",
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

const KeyText = styled(Typography)(({ theme }) => ({
	color: theme.palette.primary.main,
	fontWeight: "bold",
	marginRight: theme.spacing(1),
}));

const ValueText = styled(Typography)<{ $type: string }>(({ theme, $type }) => ({
	color:
		$type === "string"
			? theme.palette.success.main
			: $type === "number"
				? theme.palette.info.main
				: $type === "boolean"
					? theme.palette.warning.main
					: theme.palette.text.primary,
	cursor: "pointer",
	"&:hover": {
		backgroundColor: theme.palette.action.hover,
	},
}));

interface JsonNodeProps {
	data: any;
	path: string;
	depth: number;
	onUpdate: (path: string, value: any) => void;
	isLast?: boolean;
}

const JsonNode: React.FC<JsonNodeProps> = ({
	data,
	path,
	depth,
	onUpdate,
	isLast = false,
}) => {
	const [isExpanded, setIsExpanded] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState("");
	const inputRef = useRef<HTMLDivElement>(null);
	const nodeRef = useRef<HTMLDivElement>(null);

	const { focusedPath, highlightedPaths, setFocus } = useJsonEditorStore();

	const {
		selectedNodes,
		revealPosition,
		isNeedReveal,
		selectNode,
		setRevealPosition,
		currentGraph,
	} = useDataLineageStore(
		useShallow((state) => ({
			selectedNodes: state.selectedNodes,
			revealPosition: state.revealPosition,
			isNeedReveal: state.isNeedReveal,
			selectNode: state.selectNode,
			setRevealPosition: state.setRevealPosition,
			currentGraph: state.currentGraph,
		})),
	);

	const isHighlighted = highlightedPaths.has(path);
	const isFocused = focusedPath === path;

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
		if (isNeedReveal("editor") && revealPosition.nodeId && nodeRef.current) {
			const nodeIndex = currentGraph?.nodes.findIndex(
				(n) => n.id === revealPosition.nodeId,
			);
			if (nodeIndex !== undefined && nodeIndex >= 0) {
				const targetPath = `.nodes.${nodeIndex}`;
				if (path === targetPath) {
					nodeRef.current.scrollIntoView({
						behavior: "smooth",
						block: "center",
					});
					setFocus(path);
				}
			}
		}
	}, [revealPosition, isNeedReveal, currentGraph, path, setFocus]);

	const handleEdit = useCallback(
		(value: any) => {
			setEditValue(String(value));
			setIsEditing(true);
			setFocus(path);
		},
		[path, setFocus],
	);

	const handleSave = useCallback(() => {
		let parsedValue: any = editValue;

		if (editValue === "true" || editValue === "false") {
			parsedValue = editValue === "true";
		} else if (!Number.isNaN(Number(editValue)) && editValue.trim() !== "") {
			parsedValue = Number(editValue);
		} else if (editValue === "null") {
			parsedValue = null;
		}

		onUpdate(path, parsedValue);
		setIsEditing(false);
		setFocus(null);
	}, [editValue, onUpdate, path, setFocus]);

	const handleCancel = useCallback(() => {
		setIsEditing(false);
		setFocus(null);
	}, [setFocus]);

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

	const handleNodeClick = useCallback(() => {
		const pathParts = path.split(".").filter(Boolean);
		if (pathParts[0] === "nodes" && pathParts[1] !== undefined) {
			const nodeIndex = Number.parseInt(pathParts[1], 10);
			const node = currentGraph?.nodes[nodeIndex];
			if (node) {
				selectNode(node.id);
				setRevealPosition({ nodeId: node.id, from: "editor" });
			}
		}
	}, [path, currentGraph, selectNode, setRevealPosition]);

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

	if (isPrimitive(data)) {
		return (
			<JsonLine
				ref={nodeRef}
				data-path={path}
				$isHighlighted={isHighlighted}
				$isFocused={isFocused}
				$depth={depth}
				onClick={handleNodeClick}
			>
				{isEditing ? (
					<>
						<EditableValue
							ref={inputRef}
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							onKeyDown={handleKeyPress}
							size="small"
							variant="outlined"
						/>
						<IconButton size="small" onClick={handleSave}>
							<Check fontSize="small" />
						</IconButton>
						<IconButton size="small" onClick={handleCancel}>
							<Close fontSize="small" />
						</IconButton>
					</>
				) : (
					<>
						<ValueText
							$type={getValueType(data)}
							onClick={() => handleEdit(data)}
						>
							{formatValue(data)}
						</ValueText>
						<IconButton size="small" onClick={() => handleEdit(data)}>
							<Edit fontSize="small" />
						</IconButton>
					</>
				)}
				{!isLast && <Typography>,</Typography>}
			</JsonLine>
		);
	}

	const isArray = Array.isArray(data);
	const entries = isArray
		? data.map((item, index) => [index, item])
		: Object.entries(data);

	return (
		<>
			<JsonLine
				ref={nodeRef}
				data-path={path}
				$isHighlighted={isHighlighted}
				$isFocused={isFocused}
				$depth={depth}
				onClick={handleNodeClick}
			>
				<IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
					{isExpanded ? <ExpandLess /> : <ExpandMore />}
				</IconButton>
				<Typography>{isArray ? "[" : "{"}</Typography>
				{!isExpanded && (
					<Typography sx={{ ml: 1, color: "text.secondary" }}>
						...{entries.length} {isArray ? "элементов" : "свойств"}
					</Typography>
				)}
				{!isExpanded && <Typography>{isArray ? "]" : "}"}</Typography>}
				{!isLast && !isExpanded && <Typography>,</Typography>}
			</JsonLine>

			{isExpanded &&
				entries.map(([key, value], index) => {
					const currentPath = `${path}.${key}`;
					const isLastEntry = index === entries.length - 1;

					return (
						<Box key={key}>
							{!isPrimitive(value) ? (
								<>
									<JsonLine
										$isHighlighted={false}
										$isFocused={false}
										$depth={depth + 1}
									>
										{!isArray && <KeyText>"{key}":</KeyText>}
									</JsonLine>
									<JsonNode
										data={value}
										path={currentPath}
										depth={depth + 1}
										onUpdate={onUpdate}
										isLast={isLastEntry}
									/>
								</>
							) : (
								<JsonLine
									$isHighlighted={false}
									$isFocused={false}
									$depth={depth + 1}
								>
									{!isArray && <KeyText>"{key}":</KeyText>}
									<JsonNode
										data={value}
										path={currentPath}
										depth={0}
										onUpdate={onUpdate}
										isLast={isLastEntry}
									/>
								</JsonLine>
							)}
						</Box>
					);
				})}

			{isExpanded && (
				<JsonLine $isHighlighted={false} $isFocused={false} $depth={depth}>
					<Typography>{isArray ? "]" : "}"}</Typography>
					{!isLast && <Typography>,</Typography>}
				</JsonLine>
			)}
		</>
	);
};

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
		const [jsonData, setJsonData] = useState(initialData);
		const containerRef = useRef<HTMLDivElement>(null);

		const { setFocus, addHighlight, removeHighlight, clearHighlights } =
			useJsonEditorStore();

		const { revealPosition, isNeedReveal, currentGraph, selectedNodes } =
			useDataLineageStore(
				useShallow((state) => ({
					revealPosition: state.revealPosition,
					isNeedReveal: state.isNeedReveal,
					currentGraph: state.currentGraph,
					selectedNodes: state.selectedNodes,
				})),
			);

		useEffect(() => {
			if (initialData) {
				setJsonData(initialData);
			}
		}, [initialData]);

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
				const pathParts = path.split(".").filter(Boolean);

				const newData = JSON.parse(JSON.stringify(jsonData));
				let current = newData;

				for (let i = 0; i < pathParts.length - 1; i++) {
					const part = pathParts[i];
					current = current[part];
				}

				const lastPart = pathParts[pathParts.length - 1];
				current[lastPart] = value;

				setJsonData(newData);
				onChange?.(newData);
			},
			[jsonData, onChange],
		);

		const focusPath = useCallback(
			(path: string) => {
				setFocus(path);

				setTimeout(() => {
					if (containerRef.current) {
						const targetElement = containerRef.current.querySelector(
							`[data-path="${path}"]`,
						);
						if (targetElement) {
							targetElement.scrollIntoView({
								behavior: "smooth",
								block: "center",
							});
						}
					}
				}, 100);
			},
			[setFocus],
		);

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

		return (
			<Container ref={containerRef}>
				<JsonNode data={jsonData} path="" depth={0} onUpdate={updateValue} />
			</Container>
		);
	},
);
