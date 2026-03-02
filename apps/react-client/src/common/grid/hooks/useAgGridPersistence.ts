import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
	ColumnMovedEvent,
	ColumnPinnedEvent,
	ColumnResizedEvent,
	ColumnVisibleEvent,
	GridApi,
	GridReadyEvent,
	SortChangedEvent,
} from "ag-grid-community";
import { useAgGridSettingsStore } from "@react-client/common/stores/agGridSettingsStore";

interface PersistedAgGridState {
	version: 1;
	columnState: ReturnType<GridApi["getColumnState"]>;
}

const STORAGE_VERSION = 1 as const;

const safeJsonParse = (value: string): unknown => {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
};

export interface UseAgGridPersistenceParams {
	gridId: string;
	gridName: string;
	localStorageKey?: string;
	apiRef: React.MutableRefObject<GridApi | null>;
}

export interface UseAgGridPersistenceResult {
	localStorageKey: string;
	onGridReady: (event: GridReadyEvent) => void;
	onColumnMoved: (event: ColumnMovedEvent) => void;
	onColumnPinned: (event: ColumnPinnedEvent) => void;
	onColumnResized: (event: ColumnResizedEvent) => void;
	onColumnVisible: (event: ColumnVisibleEvent) => void;
	onSortChanged: (event: SortChangedEvent) => void;
	resetGridState: () => void;
}

export const useAgGridPersistence = (
	params: UseAgGridPersistenceParams,
): UseAgGridPersistenceResult => {
	const { gridId, gridName, apiRef } = params;
	const localStorageKey = useMemo(
		() => params.localStorageKey ?? `ag-grid-state:${gridId}`,
		[gridId, params.localStorageKey],
	);

	const { persistGridStateEnabled, registerGrid, isGridPersistEnabled } =
		useAgGridSettingsStore();

	const saveTimerRef = useRef<number | null>(null);

	useEffect(() => {
		registerGrid({ id: gridId, name: gridName, localStorageKey });
	}, [gridId, gridName, localStorageKey, registerGrid]);

	const saveState = useCallback(
		(api: GridApi) => {
			if (!persistGridStateEnabled) return;
			if (!isGridPersistEnabled(gridId)) return;

			const payload: PersistedAgGridState = {
				version: STORAGE_VERSION,
				columnState: api.getColumnState(),
			};
			localStorage.setItem(localStorageKey, JSON.stringify(payload));
		},
		[gridId, isGridPersistEnabled, localStorageKey, persistGridStateEnabled],
	);

	const scheduleSaveState = useCallback(
		(api: GridApi) => {
			if (saveTimerRef.current != null) {
				window.clearTimeout(saveTimerRef.current);
			}
			saveTimerRef.current = window.setTimeout(() => {
				saveTimerRef.current = null;
				saveState(api);
			}, 150);
		},
		[saveState],
	);

	const restoreState = useCallback(
		(api: GridApi) => {
			if (!persistGridStateEnabled) return;
			if (!isGridPersistEnabled(gridId)) return;

			const raw = localStorage.getItem(localStorageKey);
			if (!raw) return;

			const parsed = safeJsonParse(raw);
			if (!parsed || typeof parsed !== "object") return;

			const payload = parsed as Partial<PersistedAgGridState>;
			if (payload.version !== STORAGE_VERSION) return;
			if (!Array.isArray(payload.columnState)) return;

			api.applyColumnState({
				state: payload.columnState,
				applyOrder: true,
			});
		},
		[gridId, isGridPersistEnabled, localStorageKey, persistGridStateEnabled],
	);

	const onGridReady = useCallback(
		(event: GridReadyEvent) => {
			apiRef.current = event.api;
			restoreState(event.api);
		},
		[apiRef, restoreState],
	);

	const onColumnMoved = useCallback(
		(event: ColumnMovedEvent) => {
			scheduleSaveState(event.api);
		},
		[scheduleSaveState],
	);

	const onColumnPinned = useCallback(
		(event: ColumnPinnedEvent) => {
			scheduleSaveState(event.api);
		},
		[scheduleSaveState],
	);

	const onColumnResized = useCallback(
		(event: ColumnResizedEvent) => {
			if (event.finished) {
				scheduleSaveState(event.api);
			}
		},
		[scheduleSaveState],
	);

	const onColumnVisible = useCallback(
		(event: ColumnVisibleEvent) => {
			scheduleSaveState(event.api);
		},
		[scheduleSaveState],
	);

	const onSortChanged = useCallback(
		(event: SortChangedEvent) => {
			scheduleSaveState(event.api);
		},
		[scheduleSaveState],
	);

	const resetGridState = useCallback(() => {
		localStorage.removeItem(localStorageKey);
		apiRef.current?.resetColumnState();
	}, [apiRef, localStorageKey]);

	return {
		localStorageKey,
		onGridReady,
		onColumnMoved,
		onColumnPinned,
		onColumnResized,
		onColumnVisible,
		onSortChanged,
		resetGridState,
	};
};
