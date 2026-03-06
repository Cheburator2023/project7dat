import { memo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { useDataLineageStore } from "@react-client/common/stores/dataLineageStore";
import type { DataLineageGraph } from "@react-client/types/dataLineage";
import {
	GlobalSearchField,
	FilterButton,
	SelectedEntityChip,
} from "../../entities/molecules";

// S2T format conversion utilities
interface S2TFormat {
	generatedAt: string;
	format: string;
	desc?: { appId?: string; appName?: string };
	entities?: Array<{
		id: string;
		name: string | null;
		type: string;
		namespace?: string;
		modified?: boolean;
		description?: string;
		attrSeq?: Array<{ name: string; type: string; comment?: string }>;
	}>;
	mappings?: Array<{
		id: number;
		entityId: string;
		deps?: Array<{
			entityId: string;
			attrMaps?: Array<{ src: string; dst: string }>;
			atrDeps?: Array<{ attr: string; linkTypes?: Array<string> }>;
		}>;
	}>;
}

const _convertGraphToS2T = (graph: DataLineageGraph): S2TFormat => {
	return {
		generatedAt: new Date().toISOString(),
		format: "S2T-JSON",
		desc: graph.desc,
		entities: graph.entities?.map((entity) => ({
			id: entity.id,
			name: entity.name,
			type: entity.type,
			namespace: entity.namespace,
			modified: entity.modified,
			description: entity.description,
			attrSeq: entity.attrSeq,
		})),
		mappings: graph.mappings?.map((mapping) => ({
			id: mapping.id,
			entityId: mapping.entityId,
			deps: mapping.deps?.map((dep) => ({
				entityId: dep.entityId,
				attrMaps: dep.attrMaps,
				atrDeps: dep.atrDeps,
			})),
		})),
	};
};

export const DashboardHeader = memo(() => {
	// Data lineage store for commit functionality
	const {
		currentGraphId,
		currentGraph,
		hasUnsavedChanges,
		discardChanges,
		setCurrentGraph,
		markAsChanged,
	} = useDataLineageStore(
		useShallow((state) => ({
			currentGraphId: state.currentGraphId,
			currentGraph: state.currentGraph,
			hasUnsavedChanges: state.hasUnsavedChanges,
			discardChanges: state.discardChanges,
			setCurrentGraph: state.setCurrentGraph,
			markAsChanged: state.markAsChanged,
		})),
	);

	const [_isS2tImportDialogOpen, _setIsS2tImportDialogOpen] = useState(false);

	return (
		<>
			<Header title="Объекты данных">
				<SelectedEntityChip />
				<Flex gap={8} alignItems="center">
					<GlobalSearchField />
					<FilterButton />

					{/* <Select
						value=""
						onChange={handleImportFormatChange}
						displayEmpty
						size="small"
						title="Импорт из файла"
						renderValue={() => "Импорт"}
						sx={{
							minWidth: 40,
							"& svg": {
								display: "none",
							},
						}}
					>
						<MenuItem value="json">JSON</MenuItem>
						<MenuItem value="s2t">S2T</MenuItem>
					</Select> */}

					{/* Export format selector */}
					{/* <Select
						value=""
						onChange={handleExportFormatChange}
						displayEmpty
						size="small"
						title="Экспорт в файл"
						renderValue={() => "Экспорт"}
						sx={{
							minWidth: 40,
							"& svg": {
								display: "none",
							},
						}}
					>
						<MenuItem value="json">JSON</MenuItem>
						<MenuItem value="s2t">S2T</MenuItem>
					</Select> */}
				</Flex>
			</Header>
		</>
	);
});

DashboardHeader.displayName = "DashboardHeader";
