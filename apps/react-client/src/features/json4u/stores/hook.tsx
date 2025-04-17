"use client";

import {
	type Config,
	defaultConfig,
} from "@react-client/features/json4u/lib/db/config";
import { tryCatch } from "@react-client/features/json4u/lib/utils";

export function useConfigFromCookies() {
	const config = {
		viewMode: "graph",
		enableTextCompare: false,
		rightPanelSize: 70,
		rightPanelCollapsed: false,
		parseOptions: {
			nest: true,
			format: true,
			prettyMaxWidth: 120,
		},
		formatTabWidth: 2,
		prettyFormat: true,
		enableSyncScroll: true,
		fixSideNav: false,
		editorInitCount: 2,
	};
	return tryCatch<any>(() => config, defaultConfig);
}
