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
	setPersistLayoutsEnabled: (enabled: boolean) => void;

	// Настройки для каждой панели
	panels: PanelConfig[];

	// Включить/выключить сохранение для конкретной панели
	togglePanelPersist: (panelId: string) => void;

	// Сбросить состояние панели (удалить из localStorage)
	resetPanelState: (panelId: string) => void;

	// Сбросить все панели
	resetAllPanels: () => void;

	// Проверить, включено ли сохранение для панели
	isPanelPersistEnabled: (panelId: string) => boolean;
}

// Список всех панелей приложения
const defaultPanels: PanelConfig[] = [
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
		id: "object-card",
		name: "Карточка объекта",
		description: "Панель карточки объекта данных",
		localStorageKey: "object-card-layout",
		enabled: false,
	},
];

export const usePanelSettingsStore = create<PanelSettingsState>()(
	persist(
		(set, get) => ({
			persistLayoutsEnabled: false,
			panels: defaultPanels,

			setPersistLayoutsEnabled: (enabled: boolean) =>
				set({ persistLayoutsEnabled: enabled }),

			togglePanelPersist: (panelId: string) =>
				set((state) => ({
					panels: state.panels.map((panel) =>
						panel.id === panelId
							? { ...panel, enabled: !panel.enabled }
							: panel,
					),
				})),

			resetPanelState: (panelId: string) => {
				const panel = get().panels.find((p) => p.id === panelId);
				if (panel) {
					localStorage.removeItem(panel.localStorageKey);
				}
			},

			resetAllPanels: () => {
				const { panels } = get();
				for (const panel of panels) {
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
