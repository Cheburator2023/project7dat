import { create } from "zustand";

export interface MergeData {
	mergedJson: any;
	diffJson: any;
	commitId: string;
	processName: string;
}

interface MergeStore {
	// Состояние мерджа
	isMergeActive: boolean;
	mergeData: MergeData | null;

	// Состояние окон
	isMergeGraphWindowOpen: boolean;
	isDiffWindowOpen: boolean;

	// Действия
	startMerge: (data: MergeData) => void;
	endMerge: () => void;
	openMergeGraphWindow: () => void;
	closeMergeGraphWindow: () => void;
	openDiffWindow: () => void;
	closeDiffWindow: () => void;
	confirmMerge: () => void;
	cancelMerge: () => void;

	// Демонстрационные функции
	openDemoMergeGraphWindow: () => void;
	openDemoDiffWindow: () => void;
}

export const useMergeStore = create<MergeStore>((set) => ({
	// Начальное состояние
	isMergeActive: false,
	mergeData: null,
	isMergeGraphWindowOpen: false,
	isDiffWindowOpen: false,

	// Действия
	startMerge: (data) => {
		set({
			isMergeActive: true,
			mergeData: data,
			isMergeGraphWindowOpen: true,
			isDiffWindowOpen: true,
		});
	},

	endMerge: () => {
		set({
			isMergeActive: false,
			mergeData: null,
			isMergeGraphWindowOpen: false,
			isDiffWindowOpen: false,
		});
	},

	openMergeGraphWindow: () => {
		set({ isMergeGraphWindowOpen: true });
	},

	closeMergeGraphWindow: () => {
		set({ isMergeGraphWindowOpen: false });
	},

	openDiffWindow: () => {
		set({ isDiffWindowOpen: true });
	},

	closeDiffWindow: () => {
		set({ isDiffWindowOpen: false });
	},

	confirmMerge: () => {
		// TODO: Отправить подтверждение на бэкенд
		console.log("Подтверждение мерджа");
		set({
			isMergeActive: false,
			mergeData: null,
			isMergeGraphWindowOpen: false,
			isDiffWindowOpen: false,
		});
	},

	cancelMerge: () => {
		// TODO: Отправить отмену на бэкенд
		console.log("Отмена мерджа");
		set({
			isMergeActive: false,
			mergeData: null,
			isMergeGraphWindowOpen: false,
			isDiffWindowOpen: false,
		});
	},

	closeAllMergeWindows: () => {
		set({
			isMergeGraphWindowOpen: false,
			isDiffWindowOpen: false,
		});
	},

	// Демонстрационные функции с симуляцией данных
	openDemoMergeGraphWindow: () => {
		const demoData: MergeData = {
			mergedJson: {
				objects: [
					{ id: "obj_1", name: "user_profile", type: "table", status: "new" },
					{ id: "obj_2", name: "sales_data", type: "view", status: "modified" },
					{
						id: "obj_3",
						name: "customer_age",
						type: "column",
						status: "existing",
					},
				],
				relationships: [
					{ from: "obj_1", to: "obj_2", type: "references" },
					{ from: "obj_2", to: "obj_3", type: "contains" },
				],
			},
			diffJson: {
				added: ["user_profile"],
				modified: ["sales_data"],
				removed: [],
			},
			commitId: "demo_commit_123",
			processName: "Demo Process",
		};

		set({
			mergeData: demoData,
			isMergeGraphWindowOpen: true,
		});
	},

	openDemoDiffWindow: () => {
		const demoData: MergeData = {
			mergedJson: {
				version: "2.1.0",
				tables: {
					users: {
						columns: ["id", "name", "email", "created_at"],
						indexes: ["idx_email"],
					},
					orders: {
						columns: ["id", "user_id", "amount", "status"],
						indexes: ["idx_user_id", "idx_status"],
					},
				},
			},
			diffJson: {
				changes: [
					{
						type: "add",
						path: "tables.users.columns",
						value: "created_at",
					},
					{
						type: "modify",
						path: "tables.orders.columns.status",
						oldValue: "state",
						newValue: "status",
					},
					{
						type: "add",
						path: "tables.orders.indexes",
						value: "idx_status",
					},
				],
			},
			commitId: "demo_diff_456",
			processName: "Demo Diff Process",
		};

		set({
			mergeData: demoData,
			isDiffWindowOpen: true,
		});
	},
}));
