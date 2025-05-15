import { styled } from "@mui/material";
import { useEffect, useRef } from "react";
import {
	type JSONEditorPropsOptional,
	type JsonEditor,
	createJSONEditor,
} from "vanilla-jsoneditor";
// import "./VanillaJSONEditor.css";

export function VanillaJSONEditor(props: JSONEditorPropsOptional) {
	const refContainer = useRef<HTMLDivElement | null>(null);
	const refEditor = useRef<JsonEditor | null>(null);
	const refPrevProps = useRef<JSONEditorPropsOptional>(props);

	useEffect(() => {
		// create editor
		console.log("create editor", refContainer.current);
		refEditor.current = createJSONEditor({
			target: refContainer.current as HTMLDivElement,
			props,
		});

		return () => {
			// destroy editor
			if (refEditor.current) {
				console.log("destroy editor");
				refEditor.current.destroy();
				refEditor.current = null;
			}
		};
	}, []);

	// update props
	useEffect(() => {
		if (refEditor.current) {
			console.log("🐸 Pepe said >> useEffect >> refEditor:", refEditor);

			// only pass the props that actually changed
			// since the last time to prevent syncing issues
			const changedProps = filterUnchangedProps(props, refPrevProps.current);
			console.log("update props", changedProps);
			refEditor.current.updateProps(changedProps);
			refPrevProps.current = props;
		}
	}, [props]);

	return <Wrapper className="vanilla-jsoneditor-react" ref={refContainer} />;
}

function filterUnchangedProps(
	props: JSONEditorPropsOptional,
	prevProps: JSONEditorPropsOptional,
): JSONEditorPropsOptional {
	return Object.fromEntries(
		Object.entries(props).filter(
			([key, value]) =>
				value !== prevProps[key as keyof JSONEditorPropsOptional],
		),
	);
}

const Wrapper = styled("div")`
  .jse-key-outer {
	pointer-events: none;
  }
  .jse-key-outer .jse-context-menu-pointer {
	display: none;
  }
  /* .jse-context-menu-button[title^='Edit the key'],
  .jse-context-menu-button[title^='Cut'],
  .jse-context-menu-button[title^='Extract'],
  .jse-context-menu-button[title^='Transform'],
  .jse-context-menu-button[title^='Sort'],
  .jse-context-menu-button[title^='Convert to:'],
  .jse-contextmenu .jse-open-dropdown,
  
.jse-context-menu-button[title^='Remove'] {
	display: none;
  }
  .jse-navigation-bar-edit svg.fa-icon {
	display: none;
  } */
  .jse-label, div.jse-dropdown-button {
	display: contents;
  }
`;
