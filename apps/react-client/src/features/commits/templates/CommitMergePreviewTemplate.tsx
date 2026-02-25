import { useCallback, useEffect } from "react";
import type { FunctionComponent } from "react";
import { Box, useColorScheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useParams } from "react-router";
import { DockviewNoCloseTab } from "@react-client/common/dockview/DockviewNoCloseTab";
import { DockviewGroupMaximizeActions } from "@react-client/common/dockview/DockviewGroupMaximizeActions";
import { useS2tCommitById } from "@react-client/api/hooks";
import {
	type DockviewReadyEvent,
	type IDockviewPanelProps,
	themeAbyssSpaced,
	themeLightSpaced,
} from "@react-client/features/dockview/core";
import { DockviewReact } from "@react-client/features/dockview/src";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { LoadingSpinner } from "@react-client/features/entities/atoms/LoadingSpinner";

import { CommitEntitiesPanel } from "../organisms/CommitEntitiesPanel";
import { CommitEntitiesComparisonPanel } from "../organisms/CommitEntitiesComparisonPanel";
import { CommitGraphPanel } from "../organisms/CommitGraphPanel";
import { CommitChangeSummaryPanel } from "../organisms/CommitChangeSummaryPanel";
import { CommitMergeActionsPanel } from "../organisms/CommitMergeActionsPanel";
import { CommitObjectsPanel } from "../organisms/CommitObjectsPanel";
import { commitMergeLayoutJson } from "../constants/commitMergeLayout";
import { useCommitMergeStore } from "../stores/commitMergeStore";

const panelComponents: Record<
	string,
	FunctionComponent<IDockviewPanelProps>
> = {
	"commit-entities": () => <CommitEntitiesPanel />,
	"commit-entities-comparison": () => <CommitEntitiesComparisonPanel />,
	"commit-objects": () => <CommitObjectsPanel />,
	"commit-graph": () => <CommitGraphPanel />,
	"commit-summary": () => <CommitChangeSummaryPanel />,
	"commit-actions": () => <CommitMergeActionsPanel />,
};

export const CommitMergePreviewTemplate = () => {
	const { id: commitId } = useParams<{ id: string }>();
	const { mode } = useColorScheme();

	const { setCommit, reset } = useCommitMergeStore();

	const { data: commit, isLoading } = useS2tCommitById(commitId ?? null, {
		enabled: Boolean(commitId),
	});

	useEffect(() => {
		if (commit) {
			setCommit(commit);
		}
	}, [commit, setCommit]);

	useEffect(() => {
		return () => {
			reset();
		};
	}, [reset]);

	const onReady = useCallback((event: DockviewReadyEvent) => {
		event.api.fromJSON(commitMergeLayoutJson);
	}, []);

	if (isLoading) {
		return (
			<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
				<Header title="Предпросмотр коммита" />
				<Box
					sx={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<LoadingSpinner size={40} />
				</Box>
			</Box>
		);
	}

	if (!commit && !isLoading) {
		return (
			<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
				<Header title="Коммит не найден" />
				<Box
					sx={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexDirection: "column",
						gap: 2,
					}}
				>
					Коммит не найден
				</Box>
			</Box>
		);
	}

	return (
		<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			<Header
				title={`Предпросмотр: ${commit?.commit_name || commit?.id.slice(0, 8) || ""}`}
			/>

			<DockviewWrapper>
				<DockviewReact
					components={panelComponents}
					onReady={onReady}
					defaultRenderer="onlyWhenVisible"
					defaultTabComponent={DockviewNoCloseTab}
					rightHeaderActionsComponent={DockviewGroupMaximizeActions}
					theme={mode === "dark" ? themeAbyssSpaced : themeLightSpaced}
				/>
			</DockviewWrapper>
		</Box>
	);
};

const DockviewWrapper = styled("div")(() => ({
	flex: 1,
	position: "relative",
	overflow: "hidden",
}));
