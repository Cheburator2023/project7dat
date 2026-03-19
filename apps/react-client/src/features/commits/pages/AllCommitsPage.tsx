import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PaginationToolbar } from "@react-client/common/grid/PaginationToolbar";
import { AgGridStateControls } from "@react-client/common/grid/AgGridStateControls";
import { useAgGridPersistence } from "@react-client/common/grid/hooks/useAgGridPersistence";
import type { FC } from "react";
import {
	Alert,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	LinearProgress,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	TextField,
	Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import {
	CompareArrows as CompareArrowsIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	MoreVert as MoreVertIcon,
	Visibility as VisibilityIcon,
	Cancel as CancelIcon,
} from "@mui/icons-material";
import {
	type CellContextMenuEvent,
	type ColDef,
	type SelectionChangedEvent,
	type SortChangedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { create as createDiff } from "jsondiffpatch";
import { format as formatDiffHtml } from "jsondiffpatch/formatters/html";
import "jsondiffpatch/formatters/styles/html.css";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
	useS2tCommitList,
	PAGINATED_ENTITY_RELATIONS_QUERY_KEY,
} from "@react-client/api/hooks";
import { PAGINATED_MODEL_RELATIONS_QUERY_KEY } from "@react-client/api/hooks/usePaginatedModelRelations";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import { s2tCommitStoreService } from "@react-client/api/hooks/s2tCommitStoreApi";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { DiffJsonDialog } from "../organisms/DiffJsonDialog";
import { EditMetadataDialog } from "../organisms/EditMetadataDialog";
import { EditJsonDialog } from "../organisms/EditJsonDialog";
import { MergeIcon } from "lucide-react";
import { useMergeCancel } from "@react-client/api/hooks/useMergeCancel";
import { useMergeSessionPolling } from "@react-client/api/hooks/useMergeSessionPolling";
import { routes } from "@react-client/routing/routes";
import { useUserStore } from "@react-client/common/stores/userStore";
import { Permission } from "@react-client/types/roles";

const defaultColDef = {
	resizable: true,
	sortable: true,
	filter: true,
};

const compareDiff = createDiff();

const formatCommitOptionLabel = (commit: S2tCommitItem): string => {
	const commitId = commit.id.slice(0, 8);
	const updated = commit.updated_at
		? new Date(commit.updated_at).toLocaleString("ru-RU")
		: "дата неизвестна";
	return `${commit.commit_name || "Без названия"} (${commitId}) · ${updated}`;
};

export const AllCommitsPage: FC = () => {
	const { hasPermission } = useUserStore();

	const { mode } = useColorScheme();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [commitsPage, setCommitsPage] = useState(1);
	const [commitsPageSize, setCommitsPageSize] = useState(20);
	const [commitsSortBy, setCommitsSortBy] = useState<string | undefined>(
		undefined,
	);
	const [commitsSortOrder, setCommitsSortOrder] = useState<
		"asc" | "desc" | undefined
	>(undefined);
	const s2tCommitsQuery = useS2tCommitList({
		enabled: true,
		page: commitsPage,
		limit: commitsPageSize,
		sortBy: commitsSortBy,
		sortOrder: commitsSortOrder,
	});
	const s2tCommits = s2tCommitsQuery.data?.items ?? [];
	const totalCommits = s2tCommitsQuery.data?.total ?? 0;
	const totalCommitsPages = s2tCommitsQuery.data?.totalPages ?? 1;

	const hasProcessing = useMemo(
		() => s2tCommits.some((c) => c.state === "processing"),
		[s2tCommits],
	);
	const mergingCommit = !!(
		s2tCommits.find(
			(c) => c.state === "merging" || c.state === "deduplicating",
		) ?? null
	);

	// Polling для активной сессии слияния
	const { stopPolling, clearSession, activeSession } = useMergeSessionPolling();

	const cancelMergeMutation = useMergeCancel();

	useEffect(() => {
		if (activeSession?.status === "done") {
			if (activeSession.operation === "deduplication") {
				// toast.success("Дедупликация завершена. Повторите предпросмотр слияния.");
			} else {
				toast.success("Слияние завершено! Модель данных обновлена", {
					duration: Number.POSITIVE_INFINITY,
					action: {
						label: "На главную",
						onClick: () => {
							clearSession();
							navigate(routes.home.rootPath);
						},
					},
				});
			}
			s2tCommitsQuery.refetch();
			return;
		}
		if (activeSession?.status === "failed") {
			const processLabel =
				activeSession.operation === "deduplication"
					? "дедупликации"
					: "слияния";
			toast.error(
				`Ошибка ${processLabel}: ${activeSession.errorMessage ?? "Неизвестная ошибка"}`,
			);
		}
	}, [activeSession?.status, activeSession?.operation]);

	// Обновляем грид при изменении прогресса
	useEffect(() => {
		if (
			(activeSession?.status === "merging" ||
				activeSession?.status === "deduplicating") &&
			gridRef.current?.api
		) {
			gridRef.current.api.refreshCells({ columns: ["state"], force: true });
		}
	}, [activeSession?.progress, activeSession?.status]);

	const [editMetaCommit, setEditMetaCommit] = useState<S2tCommitItem | null>(
		null,
	);
	const [editJsonCommit, setEditJsonCommit] = useState<S2tCommitItem | null>(
		null,
	);

	// Context menu state
	const [contextMenuAnchor, setContextMenuAnchor] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [contextMenuCommit, setContextMenuCommit] =
		useState<S2tCommitItem | null>(null);

	const [diffCommit, setDiffCommit] = useState<S2tCommitItem | null>(null);
	const [deleteCommit, setDeleteCommit] = useState<S2tCommitItem | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [selectedCommits, setSelectedCommits] = useState<S2tCommitItem[]>([]);
	const [compareDialogOpen, setCompareDialogOpen] = useState(false);
	const [compareBaseId, setCompareBaseId] = useState<string>("");
	const [compareTargetId, setCompareTargetId] = useState<string>("");
	const gridRef = useRef<AgGridReact<S2tCommitItem> | null>(null);
	const gridApiRef = useRef<any>(null);
	const gridPersistence = useAgGridPersistence({
		gridId: "all-commits",
		gridName: "Коммиты",
		apiRef: gridApiRef,
	});

	const handleCommitsPageSizeChange = useCallback((size: number) => {
		setCommitsPageSize(size);
		setCommitsPage(1);
	}, []);

	const handleCommitsSortChanged = useCallback(
		(event: SortChangedEvent<S2tCommitItem>) => {
			gridPersistence.onSortChanged(event as unknown as SortChangedEvent);
			const colState = event.api.getColumnState();
			const sorted = colState.find((c) => c.sort);
			if (sorted) {
				setCommitsSortBy(sorted.colId);
				setCommitsSortOrder(sorted.sort as "asc" | "desc");
			} else {
				setCommitsSortBy(undefined);
				setCommitsSortOrder(undefined);
			}
			setCommitsPage(1);
		},
		[gridPersistence],
	);

	const handleDialogSaved = () => {
		s2tCommitsQuery.refetch();
		queryClient.invalidateQueries({
			queryKey: [...PAGINATED_ENTITY_RELATIONS_QUERY_KEY],
		});
		queryClient.invalidateQueries({
			queryKey: [...PAGINATED_MODEL_RELATIONS_QUERY_KEY],
		});
	};

	const handleDeleteConfirm = async () => {
		if (!deleteCommit) return;
		setDeleteLoading(true);
		try {
			await s2tCommitStoreService.delete(deleteCommit.id);
			toast.success("Коммит удалён");
			setDeleteCommit(null);
			s2tCommitsQuery.refetch();
		} catch (e: any) {
			toast.error(
				e?.response?.data?.message ?? e?.message ?? "Ошибка удаления",
			);
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleCancelMergingCommit = useCallback(
		async (commit: S2tCommitItem) => {
			try {
				await cancelMergeMutation.mutateAsync(commit.id);
				if (activeSession?.commitId === commit.id) {
					stopPolling();
					clearSession();
				}
				toast.success(
					commit.state === "deduplicating"
						? "Отмена дедупликации запрошена"
						: "Отмена слияния запрошена",
				);
				setContextMenuAnchor(null);
				setContextMenuCommit(null);
				s2tCommitsQuery.refetch();
			} catch (e: any) {
				toast.error(
					e?.response?.data?.message ?? e?.message ?? "Ошибка отмены процесса",
				);
			}
		},
		[
			cancelMergeMutation,
			activeSession?.commitId,
			stopPolling,
			clearSession,
			s2tCommitsQuery,
		],
	);

	const s2tColumnDefs: ColDef<any>[] = useMemo(
		() => [
			{
				headerName: "ID",
				field: "id",
				width: 120,
				pinned: "left",
				// checkboxSelection: true,
				// headerCheckboxSelection: true,
				// headerCheckboxSelectionFilteredOnly: true,
				cellRenderer: (params: any) =>
					params.value ? String(params.value).slice(0, 8) : "—",
			},
			{
				headerName: "Наименование",
				field: "commit_name",
				width: 280,
				cellRenderer: (params: any) => params.value || "—",
			},

			{
				headerName: "Автор",
				field: "user",
				width: 180,
				cellRenderer: (params: any) => params.value || "—",
			},
			{
				headerName: "Статус",
				field: "state",
				width: activeSession?.commitId ? 300 : 180,
				cellRenderer: (params: any) => {
					const state = params.value as string | undefined;
					const commitId = params.data?.id as string | undefined;
					const labelMap: Record<string, string> = {
						done: "Готово",
						failed: "Ошибка",
						processing: "В обработке",
						merging: "Слияние",
						deduplicating: "Дедупликация",
					};
					const colorMap: Record<string, ChipProps["color"]> = {
						done: "success",
						failed: "error",
						processing: "warning",
						merging: "info",
						deduplicating: "info",
					};

					if (state === "merging" || state === "deduplicating") {
						const processLabel =
							state === "deduplicating" ? "Дедупликация" : "Слияние";
						const progress =
							activeSession?.commitId === commitId &&
							activeSession?.status === state
								? activeSession.progress
								: 0;
						return (
							<Box
								sx={{
									position: "relative",
									display: "inline-flex",
									alignItems: "center",
									borderRadius: "16px",
									overflow: "hidden",
									minWidth: 100,
									height: 20,
									border: "1px solid",
									borderColor: "info.main",
									background: "transparent",
									boxShadow: "0 0 0 0 rgba(2, 136, 209, 0.35)",
									animation:
										"mergeChipPulse 1.8s ease-in-out infinite, mergeChipFloat 2.4s linear infinite",
									"@keyframes mergeChipPulse": {
										"0%": { boxShadow: "0 0 0 0 rgba(2, 136, 209, 0.35)" },
										"70%": { boxShadow: "0 0 0 6px rgba(2, 136, 209, 0)" },
										"100%": { boxShadow: "0 0 0 0 rgba(2, 136, 209, 0)" },
									},
									"@keyframes mergeChipFloat": {
										"0%": { transform: "translateX(0)" },
										"50%": { transform: "translateX(1px)" },
										"100%": { transform: "translateX(0)" },
									},
								}}
								title={activeSession?.stage ?? `${processLabel}...`}
							>
								<LinearProgress
									variant="determinate"
									value={progress}
									sx={{
										position: "absolute",
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										height: "100%",
										opacity: 0.25,
										borderRadius: "16px",
										overflow: "hidden",
										backgroundColor: "rgba(2, 136, 209, 0.08)",
										"&::after": {
											content: '""',
											position: "absolute",
											top: 0,
											left: "-35%",
											width: "35%",
											height: "100%",
											background:
												"linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
											animation: "mergeChipShimmer 1.6s linear infinite",
										},
										"& .MuiLinearProgress-bar": {
											borderRadius: "16px",
											transition: "transform 400ms ease",
										},
										"@keyframes mergeChipShimmer": {
											"0%": { left: "-35%" },
											"100%": { left: "100%" },
										},
									}}
									color="info"
								/>
								<Typography
									variant="caption"
									sx={{
										position: "relative",
										zIndex: 1,
										px: 1.5,
										whiteSpace: "nowrap",
										color: "info.main",
										fontWeight: 600,
										textShadow: "0 0 8px rgba(2, 136, 209, 0.18)",
									}}
								>
									{processLabel}: {activeSession?.stage}{" "}
									{activeSession?.progress}%
								</Typography>
							</Box>
						);
					}

					return (
						<Chip
							label={labelMap[state ?? ""] ?? state ?? "—"}
							color={colorMap[state ?? ""] ?? "default"}
							size="small"
							title={state ?? ""}
							variant="filled"
						/>
					);
				},
			},
			{
				headerName: "Описание",
				field: "commit_description",
				flex: 1,
				minWidth: 220,
				cellRenderer: (params: any) => params.value || "—",
			},

			{
				headerName: "Изменен",
				field: "updated_at",
				width: 180,
				cellRenderer: (params: any) => {
					if (!params.value) return "—";
					return new Date(params.value).toLocaleString("ru-RU");
				},
			},
			{
				headerName: "Тип файла",
				field: "type",
				width: 130,
				cellRenderer: (params: any) => {
					const type = params.value as string | undefined;
					const typeMap: Record<string, string> = {
						table: "table",
						json: "json",
						model: "model",
					};
					return typeMap[type ?? ""] ?? type ?? "—";
				},
			},
			{
				headerName: "",
				field: "actions",
				width: 60,
				sortable: false,
				filter: false,
				pinned: "right",
				cellRenderer: (params: any) => {
					const row = params.data as S2tCommitItem | undefined;
					if (!row) return null;
					return (
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								setContextMenuCommit(row);
								setContextMenuAnchor({ x: e.clientX, y: e.clientY });
							}}
						>
							<MoreVertIcon fontSize="small" />
						</IconButton>
					);
				},
			},
		],
		[activeSession],
	);

	const handleCloseContextMenu = useCallback(() => {
		setContextMenuAnchor(null);
		setContextMenuCommit(null);
	}, []);

	const handleCellContextMenu = useCallback(
		(event: CellContextMenuEvent<S2tCommitItem>) => {
			event.event?.preventDefault();
			if (event.data) {
				const mouseEvent = event.event as MouseEvent;
				setContextMenuCommit(event.data);
				setContextMenuAnchor({ x: mouseEvent.clientX, y: mouseEvent.clientY });
			}
		},
		[],
	);

	const handleOpenS2tCommitCreatePage = useCallback(() => {
		navigate("/s2t-commits/new");
	}, [navigate]);

	const handleS2tRowDoubleClick = useCallback(
		(event: any) => {
			const id = event?.data?.id;
			if (!id) return;
			// navigate(`/s2t-commits/${id}`);
			navigate(`/commits/${id}/merge`);
		},
		[navigate],
	);

	const _handleSelectionChanged = useCallback(
		(event: SelectionChangedEvent<S2tCommitItem>) => {
			const selectedRows = (event.api.getSelectedRows() ?? []).filter(
				(row): row is S2tCommitItem => Boolean(row?.id),
			);
			setSelectedCommits(selectedRows);
		},
		[],
	);

	const _handleOpenCompareSelected = useCallback(() => {
		if (selectedCommits.length < 2) {
			toast.warning("Выберите минимум 2 коммита для сравнения");
			return;
		}

		const sorted = [...selectedCommits].sort((a, b) => {
			const aTs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
			const bTs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
			return bTs - aTs;
		});

		setCompareBaseId(sorted[1]?.id ?? sorted[0].id);
		setCompareTargetId(sorted[0].id);
		setCompareDialogOpen(true);
	}, [selectedCommits]);

	const handleCloseCompareDialog = useCallback(() => {
		setCompareDialogOpen(false);
	}, []);

	const selectedCommitOptions = useMemo(() => {
		return [...selectedCommits].sort((a, b) => {
			const aTs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
			const bTs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
			return bTs - aTs;
		});
	}, [selectedCommits]);

	const baseCommit = useMemo(() => {
		return (
			selectedCommitOptions.find((commit) => commit.id === compareBaseId) ??
			null
		);
	}, [selectedCommitOptions, compareBaseId]);

	const targetCommit = useMemo(() => {
		return (
			selectedCommitOptions.find((commit) => commit.id === compareTargetId) ??
			null
		);
	}, [selectedCommitOptions, compareTargetId]);

	const compareDiffHtml = useMemo(() => {
		if (!baseCommit || !targetCommit || baseCommit.id === targetCommit.id) {
			return "";
		}

		const basePayload =
			(baseCommit.payload as Record<string, unknown> | null | undefined) ?? {};
		const targetPayload =
			(targetCommit.payload as Record<string, unknown> | null | undefined) ??
			{};
		const delta = compareDiff.diff(basePayload, targetPayload);
		if (!delta) {
			return "";
		}

		return formatDiffHtml(delta, basePayload) ?? "";
	}, [baseCommit, targetCommit]);

	return (
		<Box>
			<Header title="Коммиты">
				<Flex gap={8} alignItems="center">
					{hasPermission(Permission.DL_COMMIT_IMPORT_S2T) && (
						<Button
							onClick={handleOpenS2tCommitCreatePage}
							title={
								hasProcessing || mergingCommit
									? "Дождитесь завершения обработки текущего коммита"
									: "Импорт S2T"
							}
							variant="contained"
							disabled={hasProcessing || mergingCommit}
						>
							Импорт S2T
						</Button>
					)}
				</Flex>
			</Header>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 2,
					height: "100%",
				}}
			>
				<GridWrapper height="100%">
					<Box sx={{ position: "relative", height: "100%" }}>
						<AgGridStateControls onReset={gridPersistence.resetGridState} />
						<AgGridReact<S2tCommitItem>
							ref={gridRef}
							rowData={s2tCommits}
							columnDefs={s2tColumnDefs}
							defaultColDef={defaultColDef}
							onGridReady={(e) => {
								gridPersistence.onGridReady(e as any);
								gridApiRef.current = e.api;
							}}
							onRowDoubleClicked={handleS2tRowDoubleClick}
							onSortChanged={handleCommitsSortChanged}
							onColumnMoved={gridPersistence.onColumnMoved}
							onColumnPinned={gridPersistence.onColumnPinned}
							onColumnResized={gridPersistence.onColumnResized}
							onColumnVisible={gridPersistence.onColumnVisible}
							onCellContextMenu={handleCellContextMenu}
							preventDefaultOnContextMenu
							loading={
								s2tCommitsQuery.isLoading ||
								s2tCommitsQuery.isPending ||
								s2tCommitsQuery.isFetching
							}
							theme={
								mode === "dark"
									? agGridCustomMUIThemeDark
									: agGridCustomMUITheme
							}
							animateRows={true}
							enableCellTextSelection={true}
							ensureDomOrder={true}
							maintainColumnOrder={true}
							overlayNoRowsTemplate="Нет сущностей"
							overlayLoadingTemplate="Загрузка"
						/>
					</Box>
				</GridWrapper>

				<PaginationToolbar
					page={commitsPage}
					totalPages={totalCommitsPages}
					totalItems={totalCommits}
					pageSize={commitsPageSize}
					onPageChange={setCommitsPage}
					onPageSizeChange={handleCommitsPageSizeChange}
					isFetching={s2tCommitsQuery.isFetching}
					itemLabel="коммитов"
					pageSizeOptions={[10, 20, 50, 100]}
				/>
			</Box>

			<Menu
				open={!!contextMenuAnchor}
				onClose={handleCloseContextMenu}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenuAnchor
						? { top: contextMenuAnchor.y, left: contextMenuAnchor.x }
						: undefined
				}
			>
				{contextMenuCommit && [
					...[
						hasPermission(Permission.DL_COMMIT_EDIT_DESCRIPTION) && (
							<MenuItem
								key="edit-meta"
								disabled={contextMenuCommit.state !== "processing"}
								onClick={() => {
									setEditMetaCommit(contextMenuCommit);
									handleCloseContextMenu();
								}}
							>
								<ListItemIcon>
									<EditIcon fontSize="small" />
								</ListItemIcon>
								<ListItemText>
									Редактировать наименование и описание
								</ListItemText>
							</MenuItem>
						),
					],
					...[
						((hasPermission(Permission.DL_COMMIT_EDIT_DATA) &&
							contextMenuCommit.state === "processing") ||
							contextMenuCommit.state !== "processing") && (
							<MenuItem
								key="edit-json"
								onClick={() => {
									setEditJsonCommit(contextMenuCommit);
									handleCloseContextMenu();
								}}
							>
								<ListItemIcon>
									{contextMenuCommit.state === "processing" ? (
										<EditIcon fontSize="small" />
									) : (
										<VisibilityIcon fontSize="small" />
									)}
								</ListItemIcon>
								<ListItemText>
									{contextMenuCommit.state === "processing"
										? "Редактировать данные коммита"
										: "Просмотреть данные коммита"}
								</ListItemText>
							</MenuItem>
						),
					],
					<MenuItem
						key="diff"
						onClick={() => {
							setDiffCommit(contextMenuCommit);
							handleCloseContextMenu();
						}}
						disabled={
							contextMenuCommit.state === "done" ||
							contextMenuCommit.state === "merging"
						}
					>
						<ListItemIcon>
							<CompareArrowsIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Сравнить с актуальными данными</ListItemText>
					</MenuItem>,
					<Divider key="divider" />,
					...[
						hasPermission(Permission.DL_COMMIT_APLAY) && (
							<MenuItem
								key="merge"
								disabled={
									contextMenuCommit.state === "done" ||
									contextMenuCommit.state === "failed" ||
									contextMenuCommit.state === "merging" ||
									contextMenuCommit.state === "deduplicating"
								}
								onClick={() => {
									navigate(`/commits/${contextMenuCommit.id}/merge`);
									handleCloseContextMenu();
								}}
							>
								<ListItemIcon>
									<MergeIcon fontSize={16} />
								</ListItemIcon>
								<ListItemText>Начать применение коммита</ListItemText>
							</MenuItem>
						),
					],
					...[
						hasPermission(Permission.DL_COMMIT_ABORT) && (
							<MenuItem
								key="cancel-merge"
								disabled={
									(contextMenuCommit.state !== "merging" &&
										contextMenuCommit.state !== "deduplicating") ||
									cancelMergeMutation.isPending
								}
								onClick={() => {
									void handleCancelMergingCommit(contextMenuCommit);
								}}
								sx={{ color: "warning.main" }}
							>
								<ListItemIcon>
									<CancelIcon fontSize="small" />
								</ListItemIcon>
								<ListItemText>
									{contextMenuCommit.state === "deduplicating"
										? "Отменить дедупликацию"
										: "Отменить слияние"}
								</ListItemText>
							</MenuItem>
						),
					],
					...[
						hasPermission(Permission.DL_COMMIT_DELETE) && (
							<MenuItem
								key="delete"
								disabled={contextMenuCommit.state !== "processing"}
								onClick={() => {
									setDeleteCommit(contextMenuCommit);
									handleCloseContextMenu();
								}}
								sx={{ color: "error.main" }}
							>
								<ListItemIcon>
									<DeleteIcon fontSize="small" color="error" />
								</ListItemIcon>
								<ListItemText>Удалить коммит</ListItemText>
							</MenuItem>
						),
					],
				]}
			</Menu>

			<EditMetadataDialog
				open={!!editMetaCommit}
				commit={editMetaCommit}
				onClose={() => setEditMetaCommit(null)}
				onSaved={handleDialogSaved}
			/>
			<EditJsonDialog
				open={!!editJsonCommit}
				commit={editJsonCommit}
				editable={editJsonCommit?.state === "processing"}
				onClose={() => setEditJsonCommit(null)}
				onSaved={handleDialogSaved}
			/>
			<DiffJsonDialog
				open={!!diffCommit}
				commit={diffCommit}
				onClose={() => setDiffCommit(null)}
			/>

			<Dialog open={!!deleteCommit} onClose={() => setDeleteCommit(null)}>
				<DialogTitle>Удалить коммит?</DialogTitle>
				<DialogContent>
					<Typography variant="body2">
						Будет удалён коммит: {deleteCommit?.commit_name ?? "—"}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setDeleteCommit(null)}
						disabled={deleteLoading}
					>
						Отмена
					</Button>
					<Button
						color="error"
						variant="contained"
						onClick={handleDeleteConfirm}
						disabled={deleteLoading}
					>
						Удалить
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={compareDialogOpen}
				onClose={handleCloseCompareDialog}
				maxWidth="lg"
				fullWidth
			>
				<DialogTitle>Сравнение выбранных коммитов</DialogTitle>
				<DialogContent>
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
							gap: 2,
							mb: 2,
						}}
					>
						<TextField
							select
							label="Базовый коммит"
							value={compareBaseId}
							onChange={(event) => setCompareBaseId(event.target.value)}
							size="small"
							fullWidth
						>
							{selectedCommitOptions.map((commit) => (
								<MenuItem key={commit.id} value={commit.id}>
									{formatCommitOptionLabel(commit)}
								</MenuItem>
							))}
						</TextField>

						<TextField
							select
							label="Сравниваемый коммит"
							value={compareTargetId}
							onChange={(event) => setCompareTargetId(event.target.value)}
							size="small"
							fullWidth
						>
							{selectedCommitOptions.map((commit) => (
								<MenuItem key={commit.id} value={commit.id}>
									{formatCommitOptionLabel(commit)}
								</MenuItem>
							))}
						</TextField>
					</Box>

					{(!baseCommit || !targetCommit) && (
						<Alert severity="info">Выберите два коммита для сравнения.</Alert>
					)}
					{baseCommit && targetCommit && baseCommit.id === targetCommit.id && (
						<Alert severity="warning">
							Базовый и сравниваемый коммит не должны совпадать.
						</Alert>
					)}
					{baseCommit && targetCommit && baseCommit.id !== targetCommit.id && (
						<>
							{compareDiffHtml ? (
								<Box
									sx={{
										maxHeight: 560,
										overflow: "auto",
										"& .jsondiffpatch-delta": { fontSize: 13 },
									}}
									dangerouslySetInnerHTML={{ __html: compareDiffHtml }}
								/>
							) : (
								<Alert severity="success">
									Изменений между выбранными коммитами нет.
								</Alert>
							)}
						</>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseCompareDialog}>Закрыть</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

const GridWrapper = styled(Flex)`
	zoom: 0.8;
	& > div {
		width: 100%;
	}

	.jsondiffpatch-deleted .jsondiffpatch-property-name, .jsondiffpatch-deleted pre, .jsondiffpatch-modified .jsondiffpatch-left-value pre, .jsondiffpatch-textdiff-deleted {
    background: #8b1a1a;
}

	.jsondiffpatch-added .jsondiffpatch-property-name, .jsondiffpatch-added .jsondiffpatch-value pre, .jsondiffpatch-modified .jsondiffpatch-right-value pre, .jsondiffpatch-textdiff-added {
		background-color: #115d11;
	}
`;
