import React, { useEffect, useMemo, useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useMergeStore } from "../../../stores/mergeStore";
import { DataLineageGraph } from "@react-client/new_features/processes/organisms/DataLineageGraph";
import type {
	DataLineageSchema,
	DataLineageEntity,
} from "@data-lineage/shared-schemas";
import { isDataLineageSchema } from "@data-lineage/shared-schemas";
import {
	useApplyCommitV2,
	useApplyPartialCommitV2,
} from "@react-client/api/hooks";
import { featureFlags } from "@react-client/config/featureFlags";

type EntityDiffItem = {
	id: string;
	name: string;
	inBaseline: boolean;
	inTarget: boolean;
};

export const MergeGraphWindow: React.FC = () => {
	const {
		isMergeGraphWindowOpen,
		closeMergeGraphWindow,
		mergeData,
		confirmMerge,
	} = useMergeStore();

	const useV2Commits = featureFlags.newCommitsV2Enabled;
	const applyPartialCommitMutation = useApplyPartialCommitV2();
	const applyCommitMutation = useApplyCommitV2();
	const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);

	const { targetSchema, entityDiffItems } = useMemo(() => {
		if (!mergeData?.diffJson) {
			return {
				targetSchema: null as DataLineageSchema | null,
				entityDiffItems: [] as EntityDiffItem[],
			};
		}

		const left = mergeData.diffJson.left;
		const right = mergeData.diffJson.right;

		const baseline =
			left && isDataLineageSchema(left) ? (left as DataLineageSchema) : null;
		const target =
			right && isDataLineageSchema(right) ? (right as DataLineageSchema) : null;

		if (!baseline && !target) {
			return {
				targetSchema: null as DataLineageSchema | null,
				entityDiffItems: [] as EntityDiffItem[],
			};
		}

		const map = new Map<
			string,
			{ baseline?: DataLineageEntity; target?: DataLineageEntity }
		>();

		if (baseline) {
			baseline.entities.forEach((entity) => {
				const existing = map.get(entity.id) ?? {};
				map.set(entity.id, { ...existing, baseline: entity });
			});
		}

		if (target) {
			target.entities.forEach((entity) => {
				const existing = map.get(entity.id) ?? {};
				map.set(entity.id, { ...existing, target: entity });
			});
		}

		const items: EntityDiffItem[] = Array.from(map.entries())
			.map(([id, value]) => {
				const name = value.target?.name ?? value.baseline?.name ?? id;
				return {
					id,
					name: name ?? id,
					inBaseline: Boolean(value.baseline),
					inTarget: Boolean(value.target),
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name));

		return {
			targetSchema: target,
			entityDiffItems: items,
		};
	}, [mergeData]);

	useEffect(() => {
		if (!targetSchema || entityDiffItems.length === 0) {
			return;
		}

		const defaultSelected = entityDiffItems
			.filter((item) => item.inTarget)
			.map((item) => item.id);

		setSelectedEntityIds(defaultSelected);
	}, [targetSchema, entityDiffItems]);

	const filteredSchema = useMemo(() => {
		if (!mergeData?.mergedJson) {
			return null;
		}

		const baseSchema = mergeData.mergedJson as DataLineageSchema;

		if (!selectedEntityIds.length) {
			return baseSchema;
		}

		const selectedIdsSet = new Set(selectedEntityIds);

		const entities =
			baseSchema.entities?.filter((entity) => selectedIdsSet.has(entity.id)) ??
			[];

		const mappings =
			baseSchema.mappings?.filter((mapping) => {
				if (!selectedIdsSet.has(mapping.entityId)) {
					return false;
				}

				if (!mapping.deps || mapping.deps.length === 0) {
					return true;
				}

				return mapping.deps.every((dep) => selectedIdsSet.has(dep.entityId));
			}) ?? [];

		return {
			...baseSchema,
			entities,
			mappings,
		} as DataLineageSchema;
	}, [mergeData, selectedEntityIds]);

	const handleClose = () => {
		closeMergeGraphWindow();
	};

	const handleConfirmMerge = () => {
		if (!mergeData || !useV2Commits) return;

		applyPartialCommitMutation.mutate(
			{
				commitId: mergeData.commitId,
				selectedEntityIds,
			},
			{
				onSuccess: () => {
					confirmMerge();
				},
			},
		);
	};

	const handleConfirmFullMerge = () => {
		if (!mergeData || !useV2Commits) return;

		applyCommitMutation.mutate(mergeData.commitId, {
			onSuccess: () => {
				confirmMerge();
			},
		});
	};

	if (!mergeData || !mergeData.mergedJson || !filteredSchema) {
		return null;
	}

	const schema = filteredSchema;

	return (
		<Dialog
			open={isMergeGraphWindowOpen}
			onClose={handleClose}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: {
					height: "80vh",
					maxHeight: "80vh",
				},
			}}
		>
			<DialogTitle
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					pb: 1,
				}}
			>
				<Typography variant="h6">
					Граф модели после применения коммита {mergeData.commitId}
				</Typography>
				<IconButton
					onClick={handleClose}
					size="small"
					sx={{ color: "grey.500" }}
				>
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			<DialogContent sx={{ p: 2 }}>
				<Box
					sx={{
						height: "100%",
						display: "flex",
						flexDirection: "column",
						gap: 2,
					}}
				>
					<Typography variant="body2" color="text.secondary">
						Процесс: {mergeData.processName}
					</Typography>
					<Box
						sx={{
							flex: 1,
							minHeight: 0,
							display: "flex",
							gap: 2,
						}}
					>
						{targetSchema && entityDiffItems.length > 0 && (
							<Box
								sx={{
									width: 260,
									maxHeight: "100%",
									overflow: "auto",
									borderRight: 1,
									borderColor: "divider",
									pr: 1,
								}}
							>
								{entityDiffItems.map((item) => {
									const isSelected = selectedEntityIds.includes(item.id);
									const status = item.inBaseline
										? item.inTarget
											? "modified"
											: "removed"
										: item.inTarget
											? "new"
											: "unknown";
									const color =
										status === "new"
											? "success"
											: status === "removed"
												? "error"
												: "primary";
									const prefix =
										status === "new"
											? "[NEW] "
											: status === "removed"
												? "[REM] "
												: status === "modified"
													? "[MOD] "
													: "";

									return (
										<Button
											key={item.id}
											size="small"
											variant={isSelected ? "contained" : "text"}
											color={color}
											onClick={() => {
												setSelectedEntityIds((prev) =>
													prev.includes(item.id)
														? prev.filter((id) => id !== item.id)
														: [...prev, item.id],
												);
											}}
											sx={{
												justifyContent: "flex-start",
												width: "100%",
												mb: 0.5,
											}}
										>
											{prefix}
											{item.name}
										</Button>
									);
								})}
							</Box>
						)}
						<Box sx={{ flex: 1, minHeight: 0 }}>
							<DataLineageGraph data={schema} />
						</Box>
					</Box>
				</Box>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 2 }}>
				{useV2Commits && (
					<>
						<Button
							onClick={handleConfirmMerge}
							variant="contained"
							disabled={
								applyPartialCommitMutation.isPending ||
								applyCommitMutation.isPending
							}
						>
							Частичный мердж
						</Button>
						<Button
							onClick={handleConfirmFullMerge}
							variant="outlined"
							disabled={
								applyPartialCommitMutation.isPending ||
								applyCommitMutation.isPending
							}
						>
							Полный мердж
						</Button>
					</>
				)}
				<Button onClick={handleClose} variant="text">
					Закрыть
				</Button>
			</DialogActions>
		</Dialog>
	);
};
