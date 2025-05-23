import { Editor, type OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type React from "react";
import { type CSSProperties, useEffect, useRef, useState } from "react";

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type IModelDeltaDecoration = monaco.editor.IModelDeltaDecoration;
type IRange = monaco.Range;
type FindMatch = monaco.editor.FindMatch;
// type Monaco = typeof monaco; // Not strictly needed if using 'OnMount' for monacoInstance

export const MonacoJSONwithValidation: React.FC = () => {
	const editorRef = useRef<IStandaloneCodeEditor | null>(null);
	const [searchTerm, setSearchTerm] = useState<string>("");

	const [allMatchDecorationIds, setAllMatchDecorationIds] = useState<string[]>(
		[],
	);
	const [currentMatchDecorationId, setCurrentMatchDecorationId] = useState<
		string | null
	>(null);

	const [foundMatches, setFoundMatches] = useState<IRange[]>([]);
	const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);

	const handleEditorDidMount: OnMount = (editor, _monacoInstance) => {
		editorRef.current = editor;
	};

	// Effect to perform search when searchTerm changes or editor is mounted
	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) {
			return; // Editor not yet ready
		}

		// 1. Clear previous decorations.
		// These state variables (allMatchDecorationIds, currentMatchDecorationId)
		// hold the IDs from the *previous* application of decorations.
		editor.deltaDecorations(allMatchDecorationIds, []);
		if (currentMatchDecorationId) {
			editor.deltaDecorations([currentMatchDecorationId], []);
		}

		// Reset state for new search
		setAllMatchDecorationIds([]);
		setCurrentMatchDecorationId(null);
		setFoundMatches([]);
		setCurrentMatchIndex(-1);

		if (searchTerm.trim() === "") {
			return; // Nothing to search, decorations and state are cleared
		}

		const model = editor.getModel();
		if (!model) return;

		// 2. Find matches
		const matches: FindMatch[] = model.findMatches(
			searchTerm,
			false,
			false,
			false,
			null,
			false,
		);

		if (matches.length > 0) {
			setFoundMatches(matches.map((m) => m.range));

			// 3. Create decorations for all matches
			const allNewDecorations: IModelDeltaDecoration[] = matches.map(
				(match) => ({
					range: match.range,
					options: { className: "my-find-match-highlight" },
				}),
			);
			const newAllIds = editor.deltaDecorations([], allNewDecorations);
			setAllMatchDecorationIds(newAllIds); // Store all general highlights

			// 4. Highlight the first match as "current" and reveal it
			setCurrentMatchIndex(0);
			const firstMatchRange = matches[0].range;

			// Apply the "current" highlight to the first match.
			// This will visually layer on top of or replace the "general" highlight for this range.
			const currentNewDecoration: IModelDeltaDecoration[] = [
				{
					range: firstMatchRange,
					options: { className: "my-current-find-match-highlight" },
				},
			];
			// Note: The first match range is already decorated by `my-find-match-highlight`.
			// Adding `my-current-find-match-highlight` adds another decoration on top.
			// Alternatively, one could filter out the first match from `allNewDecorations`
			// and only apply `my-current-find-match-highlight` to it.
			// The current approach is simpler if CSS handles layering correctly.
			const newCurrentIdArray = editor.deltaDecorations(
				[],
				currentNewDecoration,
			);
			if (newCurrentIdArray.length > 0) {
				setCurrentMatchDecorationId(newCurrentIdArray[0]);
			}

			editor.revealRangeInCenterIfOutsideViewport(firstMatchRange);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchTerm, editorRef]); // CRITICAL FIX: Only depend on searchTerm and editorRef (which is stable)
	// The editor instance (editorRef.current) is accessed inside.
	// This effect runs when searchTerm changes, or initially when editorRef becomes available.

	const navigateMatches = (direction: "next" | "previous"): void => {
		const editor = editorRef.current;
		if (!editor || foundMatches.length === 0) return;

		let nextIndex = currentMatchIndex;
		if (direction === "next") {
			nextIndex = (currentMatchIndex + 1) % foundMatches.length;
		} else if (direction === "previous") {
			nextIndex =
				(currentMatchIndex - 1 + foundMatches.length) % foundMatches.length;
		}

		// If only one match, or if the index isn't actually changing (e.g. one match and clicking next)
		// just ensure it's revealed. No need to re-decorate if the current index doesn't change.
		if (nextIndex === currentMatchIndex && foundMatches.length > 0) {
			editor.revealRangeInCenterIfOutsideViewport(foundMatches[nextIndex]);
			editor.focus();
			return;
		}

		setCurrentMatchIndex(nextIndex);
		const nextMatchRange = foundMatches[nextIndex];

		// Clear the previous "current" highlight
		if (currentMatchDecorationId) {
			editor.deltaDecorations([currentMatchDecorationId], []);
		}

		// Apply new "current" highlight
		const newCurrentDecoration: IModelDeltaDecoration[] = [
			{
				range: nextMatchRange,
				options: { className: "my-current-find-match-highlight" },
			},
		];
		const newCurrentIdArray = editor.deltaDecorations([], newCurrentDecoration);
		if (newCurrentIdArray.length > 0) {
			setCurrentMatchDecorationId(newCurrentIdArray[0]);
		}

		editor.revealRangeInCenterIfOutsideViewport(nextMatchRange);
		editor.focus();
	};

	const handleSearchInputChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	): void => {
		setSearchTerm(event.target.value);
	};

	const inputStyle: CSSProperties = {
		marginRight: "10px",
		padding: "8px",
		width: "250px",
		fontSize: "14px",
	};
	const buttonStyle: CSSProperties = { padding: "8px" };
	const navigationButtonStyle: CSSProperties = {
		...buttonStyle,
		marginRight: "5px",
	};
	const countStyle: CSSProperties = { marginLeft: "10px", fontSize: "14px" };

	return (
		<div>
			<style>{`
        .my-find-match-highlight {
          background-color: rgba(255, 255, 0, 0.4); 
          box-sizing: border-box; 
        }
        .my-current-find-match-highlight {
          background-color: rgba(255, 165, 0, 0.7); 
          border: 1px solid orange; 
          box-sizing: border-box;
        }
      `}</style>
			<h1>Monaco Editor - External Search Input (TypeScript - Fixed)</h1>
			<div
				style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}
			>
				<input
					type="text"
					placeholder="Search in editor..."
					value={searchTerm}
					onChange={handleSearchInputChange}
					style={inputStyle}
				/>
				<button
					onClick={() => navigateMatches("previous")}
					disabled={foundMatches.length === 0}
					style={navigationButtonStyle}
				>
					Previous
				</button>
				<button
					onClick={() => navigateMatches("next")}
					disabled={foundMatches.length === 0}
					style={buttonStyle}
				>
					Next
				</button>
				{searchTerm && editorRef.current && (
					<span style={countStyle}>
						{foundMatches.length > 0
							? `${currentMatchIndex + 1} of ${foundMatches.length}`
							: "No matches"}
					</span>
				)}
			</div>
			<Editor
				height="500px"
				defaultLanguage="javascript"
				defaultValue={`// Type 'function' or 'hello' in the search box above.
function greet(name) {
  console.log("Hello, " + name + "!");
  // This is a sample function.
}

function anotherFunction() {
  const message = "Hello from another function.";
  console.log(message);
  // Let's say hello one more time.
}

// Hello world, this is a test.
// Searching for 'function' should highlight all function keywords.
// Searching for 'hello' should highlight all instances of hello.

class MyClass {
  constructor() {
    this.greeting = "Hello from class";
  }

  sayHello() {
    console.log(this.greeting);
  }
}

const instance = new MyClass();
instance.sayHello(); // Another hello!
`}
				onMount={handleEditorDidMount}
				options={{
					scrollBeyondLastLine: false,
					minimap: { enabled: true },
				}}
			/>
		</div>
	);
};
