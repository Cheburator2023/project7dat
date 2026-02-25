import { Parameters } from "@react-client/features/dockview/core";

export interface PanelParameters<T extends {} = Parameters> {
	params: T;
}
