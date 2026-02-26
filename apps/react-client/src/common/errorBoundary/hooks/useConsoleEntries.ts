import { useSyncExternalStore } from "react";

import {
	consoleErrorStore,
	type ConsoleEntry,
} from "@react-client/common/errorBoundary/shared/consoleErrorStore";

export const useConsoleEntries = (): ConsoleEntry[] => {
	return useSyncExternalStore(
		consoleErrorStore.subscribe,
		consoleErrorStore.getSnapshot,
		consoleErrorStore.getSnapshot,
	);
};
