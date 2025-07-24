import type { MonacoApi } from "@react-client/features/json4u/lib/editor/types";
import "@hcaptcha/types";
import type { MyWorker } from "@react-client/features/json4u/lib/worker/worker";
import type { Remote } from "comlink";
import type { ImperativePanelHandle } from "react-resizable-panels";

import type {} from "@mui/material/themeCssVarsAugmentation";

type Messages = any;
export type MessageKey = any;

declare global {
	interface IntlMessages extends Messages {}

	interface Console {
		l: (...args: any[]) => void;
	}

	interface Window {
		rawWorker: Worker;
		worker: Remote<MyWorker>;
		monacoApi: MonacoApi;
		leftPanelHandle: ImperativePanelHandle | null;
		searchComponents: Record<string, any>;
	}
}
