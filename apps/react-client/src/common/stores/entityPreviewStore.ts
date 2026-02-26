import { create } from "zustand";

interface EntityPreviewState {
	selectedEntityId: string | null;
	isPreviewOpen: boolean;
}

interface EntityPreviewActions {
	setSelectedEntityId: (entityId: string | null) => void;
	openPreview: (entityId: string) => void;
	closePreview: () => void;
}

type EntityPreviewStore = EntityPreviewState & EntityPreviewActions;

const initialState: EntityPreviewState = {
	selectedEntityId: null,
	isPreviewOpen: false,
};

export const useEntityPreviewStore = create<EntityPreviewStore>()((set) => ({
	...initialState,

	setSelectedEntityId: (entityId: string | null) => {
		set({ selectedEntityId: entityId });
	},

	openPreview: (entityId: string) => {
		set({ selectedEntityId: entityId, isPreviewOpen: true });
	},

	closePreview: () => {
		set({ isPreviewOpen: false, selectedEntityId: null });
	},
}));
