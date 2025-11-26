import React, { useMemo, useState } from "react";
import {
	Box,
	Typography,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	useColorScheme,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { fastStringify } from "@react-client/shared/src";
import type {
	DataLineageSchema,
	DataLineageEntity,
	DataLineageMapping,
} from "@data-lineage/shared-schemas";
import { isDataLineageSchema } from "@data-lineage/shared-schemas";
import { useCumulativeCommitData } from "@react-client/api/hooks";

interface CommitDetailsDialogProps {
	open: boolean;
	onClose: () => void;
	selectedCommitId: string | null;
	currentGraph: any;
}

type EntityDiffItem = {
	id: string;
	name: string;
	inBaseline: boolean;
	inTarget: boolean;
};

const buildEntityView = (
	schema: DataLineageSchema | null,
	entityId: string | null,
): {
	entity: DataLineageEntity | null;
	mappings: DataLineageMapping[];
} | null => {
	if (!schema || !entityId) {
		return null;
	}

	const entity = schema.entities.find((item) => item.id === entityId) ?? null;

	const mappings =
		schema.mappings?.filter(
			(mapping) =>
				mapping.entityId === entityId ||
				mapping.deps?.some((dep) => dep.entityId === entityId),
		) ?? [];

	return { entity, mappings };
};

export const CommitDetailsDialog: React.FC<CommitDetailsDialogProps> = ({
	open,
	onClose,
	selectedCommitId,
	currentGraph,
}) => {
	const { mode } = useColorScheme();
	const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

	const {
		data: cumulativeData,
		isLoading: isLoadingCumulative,
		error: cumulativeError,
	} = useCumulativeCommitData(selectedCommitId || "", {
		enabled: Boolean(selectedCommitId),
	});

	const baselineSchema: DataLineageSchema | null = useMemo(() => {
		if (currentGraph && isDataLineageSchema(currentGraph)) {
			return currentGraph as DataLineageSchema;
		}
		return null;
	}, [currentGraph]);

	const targetSchema: DataLineageSchema | null = useMemo(() => {
		if (cumulativeData?.fullData) {
			return cumulativeData.fullData;
		}
		return null;
	}, [cumulativeData]);

	const entityDiffItems: EntityDiffItem[] = useMemo(() => {
		if (!baselineSchema && !targetSchema) {
			return [];
		}

		const map = new Map<
			string,
			{ baseline?: DataLineageEntity; target?: DataLineageEntity }
		>();

		if (baselineSchema) {
			baselineSchema.entities.forEach((entity) => {
				const existing = map.get(entity.id) ?? {};
				map.set(entity.id, { ...existing, baseline: entity });
			});
		}

		if (targetSchema) {
			targetSchema.entities.forEach((entity) => {
				const existing = map.get(entity.id) ?? {};
				map.set(entity.id, { ...existing, target: entity });
			});
		}

		return Array.from(map.entries())
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
	}, [baselineSchema, targetSchema]);

	const effectiveSelectedEntityId = useMemo(() => {
		if (
			selectedEntityId &&
			entityDiffItems.some((item) => item.id === selectedEntityId)
		) {
			return selectedEntityId;
		}
		return entityDiffItems[0]?.id ?? null;
	}, [selectedEntityId, entityDiffItems]);

	const baselineEntityView = useMemo(
		() => buildEntityView(baselineSchema, effectiveSelectedEntityId),
		[baselineSchema, effectiveSelectedEntityId],
	);

	const targetEntityView = useMemo(
		() => buildEntityView(targetSchema, effectiveSelectedEntityId),
		[targetSchema, effectiveSelectedEntityId],
	);

	const oldValue = currentGraph
		? fastStringify(currentGraph, { space: 2 })
		: "";

	const newValue = cumulativeData?.fullData
		? fastStringify(cumulativeData.fullData, { space: 2 })
		: "";

	const entityOldValue = baselineEntityView
		? fastStringify(baselineEntityView, { space: 2 })
		: "";

	const entityNewValue = targetEntityView
		? fastStringify(targetEntityView, { space: 2 })
		: "";

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: { height: "90vh" },
			}}
		>
			<DialogTitle>
				<Box display="flex" justifyContent="space-between" alignItems="center">
					<Typography variant="h6">
						Полные данные на коммите {cumulativeData?.targetCommit?.short_id}
					</Typography>
					<IconButton onClick={onClose}>
						<CloseIcon />
					</IconButton>
				</Box>
			</DialogTitle>
			<DialogContent dividers>
				{isLoadingCumulative && <Typography>Загрузка...</Typography>}
				{cumulativeError && (
					<Typography color="error">
						Ошибка загрузки данных: {cumulativeError.message}
					</Typography>
				)}
				{cumulativeData && (
					<Box>
						<Box sx={{ mb: 3, maxHeight: "300px", overflow: "auto" }}>
							<ReactDiffViewer
								oldValue={oldValue}
								newValue={newValue}
								splitView={true}
								compareMethod={DiffMethod.CHARS}
								useDarkTheme={mode === "dark"}
								showDiffOnly
								leftTitle="Версия последнего снепшота"
								rightTitle="Выбранный коммит"
							/>
						</Box>

						{baselineSchema && targetSchema && entityDiffItems.length > 0 && (
							<Box sx={{ mb: 3 }}>
								<Typography variant="h6" gutterBottom>
									Изменения по сущностям
								</Typography>
								<Box
									sx={{
										display: "flex",
										gap: 2,
										maxHeight: "400px",
									}}
								>
									<Box
										sx={{
											minWidth: 260,
											maxHeight: "400px",
											overflow: "auto",
											borderRight: "1px solid #e0e0e0",
											pr: 1,
										}}
									>
										{entityDiffItems.map((item) => {
											const isSelected = item.id === effectiveSelectedEntityId;
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
													onClick={() => setSelectedEntityId(item.id)}
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
									<Box sx={{ flex: 1, overflow: "auto" }}>
										{effectiveSelectedEntityId ? (
											<ReactDiffViewer
												oldValue={entityOldValue}
												newValue={entityNewValue}
												splitView
												compareMethod={DiffMethod.CHARS}
												useDarkTheme={mode === "dark"}
												showDiffOnly={false}
												leftTitle="Состояние в снепшоте"
												rightTitle="Состояние на выбранном коммите"
											/>
										) : (
											<Typography variant="body2" color="text.secondary">
												Нет сущностей для сравнения
											</Typography>
										)}
									</Box>
								</Box>
							</Box>
						)}

						<Typography variant="h6" gutterBottom>
							История изменений ({cumulativeData.commits.length} коммитов):
						</Typography>
						<Box sx={{ maxHeight: "400px", overflow: "auto" }}>
							{cumulativeData.commits.map((commit, _index) => (
								<Box
									key={commit.id}
									sx={{ mb: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}
								>
									<Box
										sx={{
											p: 1,
											backgroundColor: "#f9f9f9",
											borderBottom: "1px solid #e0e0e0",
										}}
									>
										<Typography variant="subtitle2">
											{commit.short_id} - {commit.message}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{new Date(commit.createdAt).toLocaleString()}
										</Typography>
									</Box>
									{commit.diff && (
										<Box sx={{ fontSize: "12px" }}>
											<ReactDiffViewer
												oldValue={fastStringify(commit.diff.left, {
													space: 2,
												})}
												newValue={fastStringify(commit.diff.right, {
													space: 2,
												})}
												splitView={true}
												compareMethod={DiffMethod.WORDS}
												hideLineNumbers={false}
												showDiffOnly={false}
												styles={{
													variables: {
														light: {
															diffViewerBackground: "#fff",
															addedBackground: "#e6ffed",
															addedColor: "#24292e",
															removedBackground: "#ffeef0",
															removedColor: "#24292e",
															wordAddedBackground: "#acf2bd",
															wordRemovedBackground: "#fdb8c0",
															addedGutterBackground: "#cdffd8",
															removedGutterBackground: "#fdbdbe",
															gutterBackground: "#f7f7f7",
															gutterBackgroundDark: "#f7f7f7",
															highlightBackground: "#fffbdd",
															highlightGutterBackground: "#fff5b4",
														},
													},
												}}
											/>
										</Box>
									)}
								</Box>
							))}
						</Box>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Закрыть</Button>
			</DialogActions>
		</Dialog>
	);
};
