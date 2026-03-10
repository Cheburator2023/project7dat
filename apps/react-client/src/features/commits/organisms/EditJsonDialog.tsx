import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import type { FC } from "react";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Chip,
	CircularProgress,
	Alert,
	Box,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import { s2tCommitStoreService } from "@react-client/api/hooks/s2tCommitStoreApi";
import { CodeJsonEditor } from "@react-client/features/codeEditor/organisms/CodeJsonEditor";
import { useJsonEditorStore } from "@react-client/features/codeEditor/organisms/CodeJsonEditor";
import { useShallow } from "zustand/react/shallow";
import {
	createDiffWorkerScript,
	buildEntityGroups,
	formatEntityLabelForDisplay,
	convertDiffPathToRealPath,
	type DiffComputationResult,
	type DiffSummary,
	type DiffChangeItem,
} from "../diffWorker";
import { DiffChangeRow } from "./DiffChangeRow";

interface EditJsonDialogProps {
	open: boolean;
	commit: S2tCommitItem | null;
	editable?: boolean;
	onClose: () => void;
	onSaved: () => void;
}

interface EditJsonDialogEditorProps {
	data: Record<string, unknown>;
	dataKey: string;
	editable: boolean;
	saving: boolean;
	onChange: (data: any) => void;
}

const EditJsonDialogEditor = memo(
	({
		data,
		dataKey,
		editable,
		saving,
		onChange,
	}: EditJsonDialogEditorProps) => {
		return (
			<CodeJsonEditor
				initialData={data}
				dataKey={dataKey}
				onChange={onChange}
				editable={editable && !saving}
				autoExpandAll={true}
				deferInitialization={true}
				syncWithDataLineageStore={false}
			/>
		);
	},
);

EditJsonDialogEditor.displayName = "EditJsonDialogEditor";

export const EditJsonDialog: FC<EditJsonDialogProps> = ({
	open,
	commit,
	editable = true,
	onClose,
	onSaved,
}) => {
	// originalPayload — берётся из commit.original_payload (хранится на бэке)
	// editedPayload — текущий payload коммита
	const [originalPayload, setOriginalPayload] = useState<Record<
		string,
		unknown
	> | null>(null);
	const [editedPayload, setEditedPayload] = useState<Record<
		string,
		unknown
	> | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isEditorMounted, setIsEditorMounted] = useState(false);
	const [activeTab, setActiveTab] = useState(0);

	// Diff state
	const [diffResult, setDiffResult] = useState<DiffComputationResult | null>(
		null,
	);
	const [isDiffComputing, setIsDiffComputing] = useState(false);
	const [diffProgressText, setDiffProgressText] = useState("");
	const [expandedEntityKeys, setExpandedEntityKeys] = useState<string[]>([]);
	const workerRef = useRef<Worker | null>(null);
	const workerUrlRef = useRef<string | null>(null);
	const { setFocus, addHighlight, clearHighlights, setExpanded } =
		useJsonEditorStore(
			useShallow((state) => ({
				setFocus: state.setFocus,
				addHighlight: state.addHighlight,
				clearHighlights: state.clearHighlights,
				setExpanded: state.setExpanded,
			})),
		);

	// При открытии диалога — заполняем из commit без API-запроса
	useEffect(() => {
		if (!open || !commit) return;

		setError(null);
		setDiffResult(null);
		setExpandedEntityKeys([]);
		// original_payload хранится на бэке и не меняется при update
		const orig = (commit.original_payload ?? commit.payload) as Record<
			string,
			unknown
		>;
		setOriginalPayload(structuredClone(orig));
		setEditedPayload(
			structuredClone(commit.payload as Record<string, unknown>),
		);
	}, [open, commit]);

	useEffect(() => {
		if (!open || !commit) {
			setIsEditorMounted(false);
			return;
		}

		setIsEditorMounted(false);
		const rafId = window.requestAnimationFrame(() => {
			window.setTimeout(() => {
				setIsEditorMounted(true);
			}, 0);
		});

		return () => {
			window.cancelAnimationFrame(rafId);
		};
	}, [open, commit]);

	// Cleanup worker on close
	useEffect(() => {
		if (!open) {
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
			if (workerUrlRef.current) {
				URL.revokeObjectURL(workerUrlRef.current);
				workerUrlRef.current = null;
			}
		}
	}, [open]);

	// Вычислять diff при открытии модалки и при изменении данных
	useEffect(() => {
		if (!open || !originalPayload || !editedPayload) return;

		if (workerRef.current) {
			workerRef.current.terminate();
			workerRef.current = null;
		}
		if (workerUrlRef.current) {
			URL.revokeObjectURL(workerUrlRef.current);
			workerUrlRef.current = null;
		}

		setIsDiffComputing(true);
		setDiffResult(null);
		setDiffProgressText("Вычисляем diff…");
		setExpandedEntityKeys([]);

		let cancelled = false;

		const timer = window.setTimeout(() => {
			if (cancelled) return;

			try {
				if (typeof Worker === "undefined") {
					setDiffProgressText("Web Worker недоступен");
					setIsDiffComputing(false);
					return;
				}

				const workerScript = createDiffWorkerScript();
				const workerBlob = new Blob([workerScript], {
					type: "application/javascript",
				});
				const workerUrl = URL.createObjectURL(workerBlob);
				workerUrlRef.current = workerUrl;
				const worker = new Worker(workerUrl);
				workerRef.current = worker;

				worker.onmessage = (event: MessageEvent) => {
					if (cancelled) return;

					const msg = event.data;
					if (!msg || typeof msg !== "object") return;

					if (msg.type === "progress") {
						setDiffProgressText(
							`Обрабатываем изменения… ${msg.processed ?? 0} узлов`,
						);
						return;
					}

					if (msg.type === "done") {
						setDiffResult({
							summary: (msg.summary ?? {
								added: 0,
								modified: 0,
								skippedDeletions: 0,
							}) as DiffSummary,
							changes: (msg.changes ?? []) as DiffChangeItem[],
							truncated: Boolean(msg.truncated),
						});
						setIsDiffComputing(false);
						worker.terminate();
						workerRef.current = null;
						if (workerUrlRef.current) {
							URL.revokeObjectURL(workerUrlRef.current);
							workerUrlRef.current = null;
						}
					}

					if (msg.type === "error") {
						setDiffProgressText(msg.message ?? "Не удалось построить diff");
						setIsDiffComputing(false);
						worker.terminate();
						workerRef.current = null;
						if (workerUrlRef.current) {
							URL.revokeObjectURL(workerUrlRef.current);
							workerUrlRef.current = null;
						}
					}
				};

				worker.onerror = () => {
					if (!cancelled) {
						setDiffProgressText("Ошибка Web Worker при построении diff");
						setIsDiffComputing(false);
					}
					worker.terminate();
					workerRef.current = null;
					if (workerUrlRef.current) {
						URL.revokeObjectURL(workerUrlRef.current);
						workerUrlRef.current = null;
					}
				};

				worker.postMessage({
					left: originalPayload,
					right: editedPayload,
				});
			} catch {
				if (!cancelled) {
					setDiffProgressText("Не удалось запустить diff");
					setIsDiffComputing(false);
				}
			}
		}, 150);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
			if (workerUrlRef.current) {
				URL.revokeObjectURL(workerUrlRef.current);
				workerUrlRef.current = null;
			}
		};
	}, [open, originalPayload, editedPayload]);

	const diffGroups = useMemo(() => {
		if (!diffResult) return [];
		return buildEntityGroups(diffResult.changes);
	}, [diffResult]);

	// Auto-expand first few groups
	useEffect(() => {
		if (diffGroups.length > 0 && expandedEntityKeys.length === 0) {
			setExpandedEntityKeys(diffGroups.slice(0, 4).map((g) => g.entityKey));
		}
	}, [diffGroups, expandedEntityKeys.length]);

	const handleToggleEntity = useCallback((entityKey: string) => {
		setExpandedEntityKeys((prev) => {
			if (prev.includes(entityKey)) {
				return prev.filter((k) => k !== entityKey);
			}
			return [...prev, entityKey];
		});
	}, []);

	const handleJumpToJsonPath = useCallback(
		(path: string) => {
			setActiveTab(0);

			const realPath = convertDiffPathToRealPath(path, editedPayload);
			if (!realPath && realPath !== "") {
				return;
			}

			clearHighlights();
			addHighlight(realPath);

			const parts = realPath.split(".").filter(Boolean);
			let currentPath = "";
			for (const part of parts) {
				currentPath = currentPath ? `${currentPath}.${part}` : part;
				setExpanded(currentPath, true);
			}

			window.requestAnimationFrame(() => {
				setFocus(realPath);
			});
		},
		[addHighlight, clearHighlights, setExpanded, setFocus, editedPayload],
	);

	const handleEditorChange = useCallback((data: any) => {
		setEditedPayload(data as Record<string, unknown>);
		// Сбрасываем diff при изменении — пересчитается при переходе на вкладку
		setDiffResult(null);
	}, []);

	const handleSave = async () => {
		if (!commit || !editedPayload) return;
		setSaving(true);
		setError(null);
		try {
			await s2tCommitStoreService.update({
				id: commit.id,
				commit_name: commit.commit_name,
				commit_description: commit.commit_description ?? undefined,
				type: commit.type,
				user: commit.user ?? undefined,
				payload: editedPayload,
			});
			onSaved();
			onClose();
		} catch (err: any) {
			setError(
				err?.response?.data?.message ?? err?.message ?? "Ошибка сохранения",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogTitle>
				{editable ? "Редактирование" : "Просмотр"} данных коммита
				{commit && (
					<Typography variant="body2" color="text.secondary">
						{commit.commit_name} ({commit.id.slice(0, 8)})
					</Typography>
				)}
			</DialogTitle>
			<DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
				{error && (
					<Alert severity="error" sx={{ mx: 2, mt: 1 }}>
						{error}
					</Alert>
				)}

				<Tabs
					value={activeTab}
					onChange={(_, v) => setActiveTab(v as number)}
					sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
				>
					<Tab label={editable ? "Редактор" : "Просмотр"} />
					<Tab
						label={
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								Различия
								{isDiffComputing && <CircularProgress size={14} />}
								{diffResult && diffResult.changes.length > 0 && (
									<Chip
										label={diffResult.changes.length}
										size="small"
										color="warning"
										sx={{ height: 18, fontSize: "0.65rem" }}
									/>
								)}
							</Box>
						}
					/>
				</Tabs>

				{/* Editor tab */}
				<Box
					sx={{
						p: 2,
						height: 520,
						display: activeTab === 0 ? "block" : "none",
					}}
				>
					{!isEditorMounted || !editedPayload || !commit ? (
						<Box
							sx={{
								height: "100%",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: 1,
							}}
						>
							<CircularProgress size={24} />
							<Typography variant="body2" color="text.secondary">
								Подготавливаем JSON редактор…
							</Typography>
						</Box>
					) : (
						<EditJsonDialogEditor
							data={editedPayload}
							dataKey={commit.id}
							editable={editable}
							saving={saving}
							onChange={handleEditorChange}
						/>
					)}
				</Box>

				{/* Diff tab */}
				<Box
					sx={{
						p: 2,
						height: 520,
						overflow: "auto",
						display: activeTab === 1 ? "block" : "none",
					}}
				>
					{isDiffComputing && (
						<Box
							sx={{
								height: "100%",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: 1,
							}}
						>
							<CircularProgress size={24} />
							<Typography variant="body2" color="text.secondary">
								{diffProgressText}
							</Typography>
						</Box>
					)}

					{!isDiffComputing && diffResult && (
						<>
							<Box
								sx={{
									display: "flex",
									flexWrap: "wrap",
									gap: 1,
									mb: 2,
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
									<Chip
										label={`Добавлено: ${diffResult.summary.added}`}
										size="small"
										color="success"
										variant="outlined"
									/>
									{diffResult.summary.skippedDeletions > 0 && (
										<Chip
											label={`Удалено: ${diffResult.summary.skippedDeletions}`}
											size="small"
											color="error"
											variant="outlined"
										/>
									)}
									{diffResult.truncated && (
										<Chip
											label={`Показаны первые ${diffResult.changes.length}`}
											size="small"
											variant="outlined"
										/>
									)}
								</Box>
								<Box sx={{ display: "flex", gap: 1 }}>
									<Button
										size="small"
										onClick={() =>
											setExpandedEntityKeys(diffGroups.map((g) => g.entityKey))
										}
										disabled={diffGroups.length === 0}
									>
										Раскрыть все
									</Button>
									<Button
										size="small"
										onClick={() => setExpandedEntityKeys([])}
										disabled={expandedEntityKeys.length === 0}
									>
										Свернуть все
									</Button>
								</Box>
							</Box>

							{diffResult.changes.length === 0 ? (
								<Alert severity="info">Изменений не найдено.</Alert>
							) : (
								diffGroups.map((group) => {
									const expanded = expandedEntityKeys.includes(group.entityKey);
									return (
										<Accordion
											key={group.entityKey}
											expanded={expanded}
											onChange={() => handleToggleEntity(group.entityKey)}
											disableGutters
											sx={{ mb: 1 }}
										>
											<AccordionSummary
												expandIcon={<ExpandMoreIcon />}
												sx={{
													borderBottom: "1px solid",
													borderColor: "divider",
													"& .MuiAccordionSummary-content": {
														alignItems: "center",
														gap: 1,
													},
												}}
											>
												<Box
													sx={{ display: "flex", alignItems: "center", gap: 1 }}
												>
													<Typography variant="body2" sx={{ fontWeight: 600 }}>
														{formatEntityLabelForDisplay(group.entityLabel)}
													</Typography>
													{group.added > 0 && (
														<Chip
															label={`+${group.added}`}
															size="small"
															color="success"
															variant="outlined"
														/>
													)}
													{group.modified > 0 && (
														<Chip
															label={`~${group.modified}`}
															size="small"
															color="warning"
															variant="outlined"
														/>
													)}
												</Box>
											</AccordionSummary>
											<AccordionDetails sx={{ pt: 0 }}>
												<Box
													sx={{
														display: "flex",
														flexDirection: "column",
														gap: 1,
													}}
												>
													{group.changes.map((change) => (
														<DiffChangeRow
															key={`${change.type}:${change.path}`}
															change={change}
															onJumpToPath={handleJumpToJsonPath}
														/>
													))}
												</Box>
											</AccordionDetails>
										</Accordion>
									);
								})
							)}
						</>
					)}

					{!isDiffComputing && !diffResult && activeTab === 1 && (
						<Box
							sx={{
								height: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Typography variant="body2" color="text.secondary">
								Внесите изменения в редакторе и переключитесь на эту вкладку
							</Typography>
						</Box>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={saving}>
					Отмена
				</Button>
				{editable && (
					<Button
						onClick={handleSave}
						variant="contained"
						disabled={saving || !editedPayload}
						startIcon={saving ? <CircularProgress size={16} /> : undefined}
					>
						Сохранить
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};
