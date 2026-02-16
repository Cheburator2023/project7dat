import { useMemo, useCallback, useState, useEffect, useRef } from "react";
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
	IconButton,
	MenuItem,
	TextField,
	Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import {
	Code as CodeIcon,
	CompareArrows as CompareArrowsIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { type ColDef, type SelectionChangedEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { create as createDiff } from "jsondiffpatch";
import { format as formatDiffHtml } from "jsondiffpatch/formatters/html";
import "jsondiffpatch/formatters/styles/html.css";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useS2tCommitList } from "@react-client/api/hooks";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import { s2tCommitStoreService } from "@react-client/api/hooks/s2tCommitStoreApi";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { DiffJsonDialog } from "./DiffJsonDialog";
import { EditJsonDialog } from "./EditJsonDialog";
import { EditMetadataDialog } from "./EditMetadataDialog";

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
	const { mode } = useColorScheme();
	const navigate = useNavigate();
	const s2tCommitsQuery = useS2tCommitList({ enabled: true });
	const s2tCommits = s2tCommitsQuery.data ?? [];

	const hasProcessing = useMemo(
		() => s2tCommits.some((c) => c.state === "processing"),
		[s2tCommits],
	);

	const [editMetaCommit, setEditMetaCommit] = useState<S2tCommitItem | null>(
		null,
	);
	const [editJsonCommit, setEditJsonCommit] = useState<S2tCommitItem | null>(
		null,
	);
	const [diffCommit, setDiffCommit] = useState<S2tCommitItem | null>(null);
	const [deleteCommit, setDeleteCommit] = useState<S2tCommitItem | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [selectedCommits, setSelectedCommits] = useState<S2tCommitItem[]>([]);
	const [compareDialogOpen, setCompareDialogOpen] = useState(false);
	const [compareBaseId, setCompareBaseId] = useState<string>("");
	const [compareTargetId, setCompareTargetId] = useState<string>("");
	const gridRef = useRef<AgGridReact<S2tCommitItem> | null>(null);

	useEffect(() => {
		s2tCommitsQuery.refetch();
	}, []);

	const handleDialogSaved = () => {
		s2tCommitsQuery.refetch();
		// here need to refetch all main dl data
	};

	const handleDeleteRequest = (commit: S2tCommitItem) => {
		setDeleteCommit(commit);
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

	const s2tColumnDefs: ColDef<any>[] = useMemo(
		() => [
			{
				headerName: "ID",
				field: "id",
				width: 120,
				pinned: "left",
				checkboxSelection: true,
				headerCheckboxSelection: true,
				headerCheckboxSelectionFilteredOnly: true,
				cellRenderer: (params: any) =>
					params.value ? String(params.value).slice(0, 8) : "—",
			},
			{
				headerName: "Статус",
				field: "state",
				width: 150,
				cellRenderer: (params: any) => {
					const state = params.value as string | undefined;
					const labelMap: Record<string, string> = {
						done: "Готово",
						failed: "Ошибка",
						processing: "В обработке",
					};
					const colorMap: Record<string, ChipProps["color"]> = {
						done: "success",
						failed: "error",
						processing: "warning",
					};
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
				headerName: "Название",
				field: "commit_name",
				width: 280,
				cellRenderer: (params: any) => params.value || "—",
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
				headerName: "Автор",
				field: "user",
				width: 180,
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
				headerName: "Описание",
				field: "commit_description",
				flex: 1,
				minWidth: 220,
				cellRenderer: (params: any) => params.value || "—",
			},

			{
				headerName: "Действия",
				field: "actions",
				width: 200,
				sortable: false,
				filter: false,
				pinned: "right",
				cellRenderer: (params: any) => {
					const row = params.data as S2tCommitItem | undefined;
					if (!row) return null;
					const canEditCommit = row.state === "processing";
					const jsonTitle = canEditCommit
						? "Редактировать JSON"
						: "Просмотреть JSON";
					return (
						<Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
							<IconButton
								size="small"
								title="Редактировать метаданные"
								disabled={!canEditCommit}
								onClick={(e) => {
									e.stopPropagation();
									setEditMetaCommit(row);
								}}
							>
								<EditIcon fontSize="small" />
							</IconButton>

							<IconButton
								title={jsonTitle}
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									setEditJsonCommit(row);
								}}
							>
								{canEditCommit ? (
									<CodeIcon fontSize="small" />
								) : (
									<VisibilityIcon fontSize="small" />
								)}
							</IconButton>

							<IconButton
								title="Diff к текущему JSON"
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									setDiffCommit(row);
								}}
							>
								<CompareArrowsIcon fontSize="small" />
							</IconButton>

							{/* <JsonViewerCell
								value={params.data?.payload}
								maxPreviewLength={80}
							/> */}

							<span title="Удалить коммит">
								<IconButton
									size="small"
									color="error"
									disabled={!canEditCommit}
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteRequest(row);
									}}
								>
									<DeleteIcon fontSize="small" />
								</IconButton>
							</span>
						</Box>
					);
				},
			},
		],
		[],
	);

	const handleOpenS2tCommitCreatePage = useCallback(() => {
		navigate("/s2t-commits/new");
	}, [navigate]);

	const handleS2tRowDoubleClick = useCallback(
		(event: any) => {
			const id = event?.data?.id;
			if (!id) return;
			navigate(`/s2t-commits/${id}`);
		},
		[navigate],
	);

	const handleSelectionChanged = useCallback(
		(event: SelectionChangedEvent<S2tCommitItem>) => {
			const selectedRows = (event.api.getSelectedRows() ?? []).filter(
				(row): row is S2tCommitItem => Boolean(row?.id),
			);
			setSelectedCommits(selectedRows);
		},
		[],
	);

	const handleOpenCompareSelected = useCallback(() => {
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
			<Header>
				<Flex gap={8} alignItems="center">
					<Button
						onClick={handleOpenS2tCommitCreatePage}
						title={
							hasProcessing
								? "Дождитесь завершения обработки текущего коммита"
								: "Импорт S2T"
						}
						variant="contained"
						disabled={hasProcessing}
					>
						Импорт S2T
					</Button>
					<Button
						variant="outlined"
						onClick={handleOpenCompareSelected}
						disabled={selectedCommits.length !== 2}
					>
						Сравнить выбранные ({selectedCommits.length})
					</Button>
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
					<AgGridReact<S2tCommitItem>
						ref={gridRef}
						rowData={s2tCommits}
						columnDefs={s2tColumnDefs}
						defaultColDef={defaultColDef}
						onRowDoubleClicked={handleS2tRowDoubleClick}
						onSelectionChanged={handleSelectionChanged}
						pagination={true}
						paginationPageSize={20}
						paginationPageSizeSelector={[10, 20, 50, 100]}
						loading={s2tCommitsQuery.isLoading}
						theme={
							mode === "dark" ? agGridCustomMUIThemeDark : agGridCustomMUITheme
						}
						animateRows={true}
						enableCellTextSelection={true}
						ensureDomOrder={true}
						maintainColumnOrder={true}
						rowSelection={"multiple"}
					/>
				</GridWrapper>
			</Box>
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
    background: #ffbbbb;
}

	.jsondiffpatch-added .jsondiffpatch-property-name, .jsondiffpatch-added .jsondiffpatch-value pre, .jsondiffpatch-modified .jsondiffpatch-right-value pre, .jsondiffpatch-textdiff-added {
		background-color: #115d11;
	}
`;
