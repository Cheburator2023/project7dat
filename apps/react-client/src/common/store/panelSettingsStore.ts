import { create } from "zustand";
import { persist } from "zustand/middleware";

// Определение всех панелей приложения с flexlayout-react
export interface PanelConfig {
	id: string;
	name: string;
	description: string;
	localStorageKey: string;
	enabled: boolean;
}

interface PanelSettingsState {
	// Глобальная настройка сохранения в localStorage
	persistLayoutsEnabled: boolean;
	panels: PanelConfig[];
	setPersistLayoutsEnabled: (enabled: boolean) => void;

	// Включить/выключить сохранение для конкретной панели
	togglePanelPersist: (panelId: string) => void;

	// Сбросить состояние панели (удалить из localStorage)
	resetPanelState: (panelId: string) => void;

	// Сбросить все панели
	resetAllPanels: () => void;

	// Проверить, включено ли сохранение для панели
	isPanelPersistEnabled: (panelId: string) => any;
}

// Список всех панелей приложения
export const defaultPanelsSettings: PanelConfig[] = [
	{
		id: "dashboard",
		name: "Главная (Dashboard)",
		description: "Основная панель с графом, сущностями и редактором кода",
		localStorageKey: "dashboard2-flex-layout",
		enabled: false,
	},
	{
		id: "entity-preview",
		name: "Просмотр сущности",
		description: "Панель просмотра деталей сущности",
		localStorageKey: "entity-preview-layout",
		enabled: false,
	},
	{
		id: "model-preview",
		name: "Просмотр модели",
		description: "Панель просмотра деталей модели",
		localStorageKey: "model-preview-layout",
		enabled: false,
	},
];

export const usePanelSettingsStore = create<PanelSettingsState>()(
	persist(
		(set, get) => ({
			persistLayoutsEnabled: false,
			panels: defaultPanelsSettings,
			setPersistLayoutsEnabled: (enabled: boolean) => {
				if (!enabled) {
					// При выключении глобальной настройки сбрасываем все панели
					for (const panel of get().panels) {
						localStorage.removeItem(panel.localStorageKey);
					}
				}

				set({ persistLayoutsEnabled: enabled });

				if (!enabled) {
					localStorage.removeItem("panel-settings-storage");
				}
			},

			togglePanelPersist: (panelId: string) => {
				const panel = get().panels.find((p) => p.id === panelId);

				if (panel && panel.enabled) {
					// При выключении панели удаляем её layout из localStorage
					localStorage.removeItem(panel.localStorageKey);
				}

				set((state) => ({
					panels: state.panels.map((p) =>
						p.id === panelId ? { ...p, enabled: !p.enabled } : p,
					),
				}));
			},

			resetPanelState: (panelId: string) => {
				const panel = get().panels.find((p) => p.id === panelId);
				if (panel) {
					localStorage.removeItem(panel.localStorageKey);
				}
			},

			resetAllPanels: () => {
				for (const panel of get().panels) {
					localStorage.removeItem(panel.localStorageKey);
				}
			},

			isPanelPersistEnabled: (panelId: string) => {
				const state = get();
				if (!state.persistLayoutsEnabled) return false;
				const panel = state.panels.find((p) => p.id === panelId);
				return panel?.enabled ?? false;
			},
		}),
		{
			name: "panel-settings-storage",
		},
	),
);
