import { Component, ReactNode } from "react";
import { create } from "jsondiffpatch";

import "jsondiffpatch/formatters/styles/html.css";
import "jsondiffpatch/formatters/styles/annotated.css";

import * as html from "jsondiffpatch/formatters/html";
import * as annotated from "jsondiffpatch/formatters/annotated";

interface JsondiffpatchReactProps {
	right: any;
	left: any;
	show?: boolean;
	isAnnotated?: boolean;
	tips?: ReactNode;
	objectHash?: (obj: any) => string;
}

export class JsondiffpatchReact extends Component<JsondiffpatchReactProps> {
	render() {
		const {
			right,
			left,
			show = true,
			isAnnotated = false,
			tips = "Оба объекта идентичны.",
			objectHash,
		} = this.props;

		const delta = create({
			objectHash,
		}).diff(left, right);

		const _html = isAnnotated
			? (annotated as any).format(delta)
			: (html as any).format(delta, left);

		if (show) {
			(html as any).showUnchanged();
		} else {
			(html as any).hideUnchanged();
		}

		return _html ? (
			<div dangerouslySetInnerHTML={{ __html: _html }} />
		) : typeof tips === "string" ? (
			<p style={{ fontSize: 12, color: "#999" }}>{tips}</p>
		) : (
			tips
		);
	}
}
