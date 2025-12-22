import type { IJsonModel } from "flexlayout-react";

export interface PanelDefinition {
	id: string;
	name: string;
	icon: string;
	component: string;
	description: string;
}

export interface LayoutPreset {
	id: string;
	name: string;
	icon: string;
	description: string;
	layout: IJsonModel;
}

export type BuilderMode = "empty" | "custom" | "preset";

export type ModalStep = "initial" | "presets" | "custom";
