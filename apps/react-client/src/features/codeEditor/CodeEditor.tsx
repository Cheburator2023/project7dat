import { Editor as MonacoEditor } from "@monaco-editor/react";
import {
	CircularProgress,
	useColorScheme,
	Box,
	Button,
	IconButton,
	Tooltip,
	Alert,
	Snackbar,
} from "@mui/material";
import {
	Save as SaveIcon,
	Cancel as CancelIcon,
	Undo as UndoIcon,
	Redo as RedoIcon,
} from "@mui/icons-material";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useRevealNode } from "./hooks/useRevealNode";
import { findNodeByPosition } from "./utils/jsonPosition";
import { debounce } from "lodash-es";

import {
	type ComponentPropsWithoutRef,
	useRef,
	useMemo,
	useCallback,
	useState,
	useEffect,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { dataLineageSchema } from "@react-client/schemas";
import { styled } from "@mui/material/styles";

interface JsonRange {
	startLineNumber: number;
	startColumn: number;
	endLineNumber: number;
	endColumn: number;
}

interface JsonKeyRange extends JsonRange {
	type: "key";
}

interface JsonValueRange extends JsonRange {
	type: "value";
}

const EditorContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius,
}));

const ControlPanel = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	padding: theme.spacing(1, 2),
	borderBottom: `1px solid ${theme.palette.divider}`,
	backgroundColor: theme.palette.background.paper,
}));

const ButtonGroup = styled(Box)(({ theme }) => ({
	display: "flex",
	gap: theme.spacing(1),
	alignItems: "center",
}));

const EditorWrapper = styled(Box)(({ theme }) => ({
	flex: 1,
	minHeight: 0,
	"& .json-key-readonly": {
		backgroundColor:
			theme.palette.mode === "dark"
				? "rgba(255, 255, 255, 0.05)"
				: "rgba(0, 0, 0, 0.05)",
		border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
		borderRadius: "2px",
		pointerEvents: "none",
	},
	"& .json-key-readonly-inline": {
		color: theme.palette.mode === "dark" ? "#8a8a8a" : "#666666",
		fontStyle: "italic",
		cursor: "not-allowed",
		pointerEvents: "none",
	},
}));

function parseJsonRanges(jsonText: string): (JsonKeyRange | JsonValueRange)[] {
	const ranges: (JsonKeyRange | JsonValueRange)[] = [];

	try {
		JSON.parse(jsonText);
	} catch {
		return ranges;
	}

	const lines = jsonText.split("\n");

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex];
		const lineNumber = lineIndex + 1;

		// More comprehensive regex to match JSON keys (quoted strings followed by colon)
		const keyRegex = /"([^"\\]|\\.)*"\s*:/g;
		let match: RegExpExecArray | null;

		// Find all keys in this line
		while ((match = keyRegex.exec(line)) !== null) {
			const fullMatch = match[0];
			const colonIndex = fullMatch.lastIndexOf(":");
			const keyPart = fullMatch.substring(0, colonIndex);

			ranges.push({
				type: "key",
				startLineNumber: lineNumber,
				startColumn: match.index + 1, // Monaco uses 1-based columns
				endLineNumber: lineNumber,
				endColumn: match.index + keyPart.length + 1,
			});
		}

		// Find values - this is more complex as values can be strings, numbers, booleans, objects, arrays
		const valuePatterns = [
			/:\s*"([^"\\]|\\.)*"/g, // String values
			/:\s*-?\d+(\.\d+)?([eE][+-]?\d+)?/g, // Number values
			/:\s*(true|false|null)/g, // Boolean and null values
		];

		for (const valueRegex of valuePatterns) {
			valueRegex.lastIndex = 0; // Reset regex
			while ((match = valueRegex.exec(line)) !== null) {
				const fullMatch = match[0];
				const colonIndex = fullMatch.indexOf(":");
				const valueStart = match.index + colonIndex + 1;

				// Skip whitespace after colon
				let actualValueStart = valueStart;
				while (
					actualValueStart < match.index + fullMatch.length &&
					/\s/.test(line[actualValueStart - 1])
				) {
					actualValueStart++;
				}

				ranges.push({
					type: "value",
					startLineNumber: lineNumber,
					startColumn: actualValueStart,
					endLineNumber: lineNumber,
					endColumn: match.index + fullMatch.length + 1,
				});
			}
		}
	}

	return ranges;
}

function isPositionInKeyRange(
	position: { lineNumber: number; column: number },
	keyRanges: JsonKeyRange[],
): boolean {
	return keyRanges.some(
		(range) =>
			position.lineNumber === range.startLineNumber &&
			position.column >= range.startColumn &&
			position.column <= range.endColumn,
	);
}

interface EditorProps extends ComponentPropsWithoutRef<typeof MonacoEditor> {
	readOnly?: boolean;
}

export function CodeEditor({ readOnly = false, ...props }: EditorProps) {
	const { mode } = useColorScheme();
	const editorRef = useRef<any>(null);
	const monacoRef = useRef<any>(null);

	const [localValue, setLocalValue] = useState<string>("");
	const [hasChanges, setHasChanges] = useState(false);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [keyRanges, setKeyRanges] = useState<JsonKeyRange[]>([]);
	const [isUpdatingFromInternal, setIsUpdatingFromInternal] = useState(false);

	const {
		currentGraph,
		selectedNodes,
		importGraph,
		selectNode,
		setRevealPosition,
	} = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
			selectedNodes: state.selectedNodes,
			importGraph: state.importGraph,
			selectNode: state.selectNode,
			setRevealPosition: state.setRevealPosition,
		})),
	);

	const originalValue = useMemo(() => {
		if (!currentGraph) return "{}";
		return JSON.stringify(currentGraph, null, 2);
	}, [currentGraph]);

	useEffect(() => {
		setLocalValue(originalValue);
		setHasChanges(false);
		setValidationErrors([]);

		const ranges = parseJsonRanges(originalValue);
		setKeyRanges(
			ranges.filter((range) => range.type === "key") as JsonKeyRange[],
		);
	}, [originalValue]);

	useRevealNode(editorRef.current, localValue);

	useEffect(() => {
		if (!editorRef.current || !monacoRef.current || keyRanges.length === 0)
			return;

		const decorations = keyRanges.map((range) => ({
			range: new monacoRef.current.Range(
				range.startLineNumber,
				range.startColumn,
				range.endLineNumber,
				range.endColumn,
			),
			options: {
				className: "json-key-readonly",
				inlineClassName: "json-key-readonly-inline",
				hoverMessage: {
					value: "JSON keys are read-only. Only values can be edited.",
				},
				isWholeLine: false,
			},
		}));

		const model = editorRef.current.getModel();
		if (model) {
			model.deltaDecorations([], decorations);
		}
	}, [keyRanges]);

	const validateJson = useCallback((value: string): string[] => {
		const errors: string[] = [];

		try {
			JSON.parse(value);
		} catch (error) {
			errors.push(
				`Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			return errors;
		}

		if (editorRef.current && monacoRef.current) {
			const model = editorRef.current.getModel();
			if (model) {
				const markers = monacoRef.current.editor.getModelMarkers({
					resource: model.uri,
				});
				const schemaErrors = markers.filter(
					(marker: any) => marker.severity === 8,
				);
				errors.push(
					...schemaErrors.map(
						(marker: any) =>
							`Line ${marker.startLineNumber}: ${marker.message}`,
					),
				);
			}
		}

		return errors;
	}, []);

	const handleCursorPositionChange = useCallback(
		debounce((e: any) => {
			if (!editorRef.current || !currentGraph) return;

			const { lineNumber, column } = e.position;
			const nodeId = findNodeByPosition(
				localValue,
				{ line: lineNumber, column },
				currentGraph,
			);

			if (nodeId && !selectedNodes.includes(nodeId)) {
				selectNode(nodeId);
				setRevealPosition({ nodeId, from: "editor" });
			}
		}, 200),
		[localValue, currentGraph, selectedNodes, selectNode, setRevealPosition],
	);

	const handleEditorChange = useCallback(
		(value: string | undefined) => {
			if (readOnly || !value || isUpdatingFromInternal) return;

			setLocalValue(value);
			setHasChanges(value !== originalValue);

			const errors = validateJson(value);
			setValidationErrors(errors);

			const ranges = parseJsonRanges(value);
			setKeyRanges(
				ranges.filter((range) => range.type === "key") as JsonKeyRange[],
			);

			setCanUndo(true);
			setCanRedo(false);
		},
		[readOnly, originalValue, validateJson, isUpdatingFromInternal],
	);

	const handleSave = useCallback(async () => {
		if (!hasChanges || validationErrors.length > 0) return;

		try {
			await importGraph(localValue, "json");
			setHasChanges(false);
			setShowSuccessMessage(true);
		} catch (error) {
			console.error("Failed to save:", error);
		}
	}, [hasChanges, validationErrors, localValue, importGraph]);

	const handleCancel = useCallback(() => {
		setIsUpdatingFromInternal(true);
		setLocalValue(originalValue);
		setHasChanges(false);
		setValidationErrors([]);

		const ranges = parseJsonRanges(originalValue);
		setKeyRanges(
			ranges.filter((range) => range.type === "key") as JsonKeyRange[],
		);

		if (editorRef.current) {
			setCanUndo(false);
			setCanRedo(false);
		}

		setTimeout(() => setIsUpdatingFromInternal(false), 0);
	}, [originalValue]);

	const handleUndo = useCallback(() => {
		if (editorRef.current) {
			editorRef.current.trigger("keyboard", "undo", null);
		}
	}, []);

	const handleRedo = useCallback(() => {
		if (editorRef.current) {
			editorRef.current.trigger("keyboard", "redo", null);
		}
	}, []);

	const canSave = hasChanges && validationErrors.length === 0;

	return (
		<EditorContainer>
			<ControlPanel>
				<ButtonGroup>
					<Tooltip title="Undo">
						<span>
							<IconButton
								onClick={handleUndo}
								disabled={!canUndo || readOnly}
								size="small"
							>
								<UndoIcon />
							</IconButton>
						</span>
					</Tooltip>
					<Tooltip title="Redo">
						<span>
							<IconButton
								onClick={handleRedo}
								disabled={!canRedo || readOnly}
								size="small"
							>
								<RedoIcon />
							</IconButton>
						</span>
					</Tooltip>
				</ButtonGroup>

				<ButtonGroup>
					{validationErrors.length > 0 && (
						<Alert severity="error" sx={{ py: 0, px: 1 }}>
							{validationErrors.length} validation error
							{validationErrors.length > 1 ? "s" : ""}
						</Alert>
					)}
					<Button
						variant="outlined"
						onClick={handleCancel}
						disabled={!hasChanges || readOnly}
						startIcon={<CancelIcon />}
						size="small"
					>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={!canSave || readOnly}
						startIcon={<SaveIcon />}
						size="small"
					>
						Save
					</Button>
				</ButtonGroup>
			</ControlPanel>

			<EditorWrapper>
				<MonacoEditor
					language="json"
					loading={<CircularProgress />}
					theme={mode === "dark" ? "vs-dark" : "light"}
					value={localValue}
					onChange={handleEditorChange}
					options={{
						fontSize: 12,
						scrollBeyondLastLine: true,
						automaticLayout: true,
						wordWrap: "on",
						minimap: { enabled: true },
						readOnly,
						stickyScroll: {
							enabled: true,
							defaultModel: "foldingProviderModel",
						},
					}}
					onMount={(editor, monaco) => {
						monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
							validate: true,
							schemas: [
								{
									uri: "http://data-lineage-schema.json",
									fileMatch: ["*"],
									schema: dataLineageSchema,
								},
							],
						});

						if (!window.monacoApi) {
							window.monacoApi = {
								KeyCode: monaco.KeyCode,
								MinimapPosition: monaco.editor.MinimapPosition,
								OverviewRulerLane: monaco.editor.OverviewRulerLane,
								Range: monaco.Range,
								RangeFromPositions: monaco.Range.fromPositions,
							};
						}

						editorRef.current = editor;
						monacoRef.current = monaco;

						editor.onDidChangeCursorPosition(handleCursorPositionChange);

						const model = editor.getModel();
						if (model) {
							let lastValidContent = model.getValue();

							model.onDidChangeContent((e) => {
								// Update undo/redo state directly
								if (editorRef.current) {
									const undoAction = editorRef.current.getAction("undo");
									const redoAction = editorRef.current.getAction("redo");
									setCanUndo(undoAction ? undoAction.isEnabled() : false);
									setCanRedo(redoAction ? redoAction.isEnabled() : false);
								}

								if (readOnly || isUpdatingFromInternal) return;

								const currentContent = model.getValue();

								// Parse ranges from the previous content to check if change overlaps with keys
								const previousRanges = parseJsonRanges(lastValidContent);
								const previousKeyRanges = previousRanges.filter(
									(range) => range.type === "key",
								) as JsonKeyRange[];

								// Check if any changes affected key areas or key quotes
								let hasKeyChanges = false;
								for (const change of e.changes) {
									const changeStart = {
										lineNumber: change.range.startLineNumber,
										column: change.range.startColumn,
									};
									const changeEnd = {
										lineNumber: change.range.endLineNumber,
										column: change.range.endColumn,
									};

									// Check if change overlaps with any key range (including quotes)
									for (const keyRange of previousKeyRanges) {
										const keyStart = {
											lineNumber: keyRange.startLineNumber,
											column: keyRange.startColumn,
										};
										const keyEnd = {
											lineNumber: keyRange.endLineNumber,
											column: keyRange.endColumn,
										};

										// Check if change overlaps with key range (including quotes)
										if (
											(changeStart.lineNumber < keyEnd.lineNumber ||
												(changeStart.lineNumber === keyEnd.lineNumber &&
													changeStart.column <= keyEnd.column)) &&
											(changeEnd.lineNumber > keyStart.lineNumber ||
												(changeEnd.lineNumber === keyStart.lineNumber &&
													changeEnd.column >= keyStart.column))
										) {
											hasKeyChanges = true;
											break;
										}
									}

									if (hasKeyChanges) break;
								}

								// Also check if the current content has fewer keys than before (key deletion)
								const currentRanges = parseJsonRanges(currentContent);
								const currentKeyRanges = currentRanges.filter(
									(range) => range.type === "key",
								) as JsonKeyRange[];

								if (currentKeyRanges.length < previousKeyRanges.length) {
									hasKeyChanges = true;
								}

								if (hasKeyChanges) {
									// Revert to last valid content
									setIsUpdatingFromInternal(true);
									model.setValue(lastValidContent);
									setTimeout(() => setIsUpdatingFromInternal(false), 0);
								} else {
									// Update last valid content
									lastValidContent = currentContent;
								}
							});
						}

						editor.onKeyDown((e: any) => {
							if (readOnly) return;

							const position = editor.getPosition();
							const currentContent = editor.getValue();
							const currentRanges = parseJsonRanges(currentContent);
							const currentKeyRanges = currentRanges.filter(
								(range) => range.type === "key",
							) as JsonKeyRange[];

							if (
								position &&
								isPositionInKeyRange(position, currentKeyRanges)
							) {
								if (
									e.keyCode === monaco.KeyCode.Backspace ||
									e.keyCode === monaco.KeyCode.Delete ||
									e.keyCode === monaco.KeyCode.Enter ||
									(e.keyCode >= monaco.KeyCode.KeyA &&
										e.keyCode <= monaco.KeyCode.KeyZ) ||
									(e.keyCode >= monaco.KeyCode.Digit0 &&
										e.keyCode <= monaco.KeyCode.Digit9)
								) {
									e.preventDefault();
									e.stopPropagation();
								}
							}
						});

						editor.onDidPaste((e: any) => {
							if (readOnly) return;

							const { range } = e;
							const startPosition = {
								lineNumber: range.startLineNumber,
								column: range.startColumn,
							};
							const endPosition = {
								lineNumber: range.endLineNumber,
								column: range.endColumn,
							};

							const currentContent = editor.getValue();
							const currentRanges = parseJsonRanges(currentContent);
							const currentKeyRanges = currentRanges.filter(
								(range) => range.type === "key",
							) as JsonKeyRange[];

							if (
								isPositionInKeyRange(startPosition, currentKeyRanges) ||
								isPositionInKeyRange(endPosition, currentKeyRanges)
							) {
								e.preventDefault();
							}
						});

						console.log("Data lineage editor initialized:", editor);
					}}
					{...props}
				/>
			</EditorWrapper>

			<Snackbar
				open={showSuccessMessage}
				autoHideDuration={3000}
				onClose={() => setShowSuccessMessage(false)}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Alert severity="success" onClose={() => setShowSuccessMessage(false)}>
					Changes saved successfully!
				</Alert>
			</Snackbar>
		</EditorContainer>
	);
}
