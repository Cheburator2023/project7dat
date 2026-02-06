import { useMemo, useCallback, useState } from "react";
import { Chip, IconButton } from "@mui/material";
import type { ChipProps } from "@mui/material";
import type { FC } from "react";
import {
	Box,
	Typography,
	Button,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";
import { toast } from "sonner";
import {
	Edit as EditIcon,
	Code as CodeIcon,
	CallMerge as MergeIcon,
	Delete as DeleteIcon,
} from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { useNavigate } from "react-router";
import {
	agGridCustomMUITheme,
	agGridCustomMUIThemeDark,
} from "@react-client/theme/ag-grid/agGridCustomTheme";
import { useS2tCommitList } from "@react-client/api/hooks";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import { s2tCommitStoreService } from "@react-client/api/hooks/s2tCommitStoreApi";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { JsonViewerCell } from "@react-client/common/grid/JsonViewerCell";
import { useAuthStore } from "@react-client/common/store/authStore";
import { EditMetadataDialog } from "./EditMetadataDialog";
import { EditJsonDialog } from "./EditJsonDialog";
import { MergeCommitDialog } from "./MergeCommitDialog";

export const AllCommitsPage: FC = () => {
	const { mode } = useColorScheme();
	const navigate = useNavigate();
	const authStore = useAuthStore();
	const username = authStore.userInfo?.username ?? "system";
	const s2tCommitsQuery = useS2tCommitList({ enabled: true });
	const s2tCommits = s2tCommitsQuery.data ?? [];
	const error = s2tCommitsQuery.error;

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
	const [mergeCommit, setMergeCommit] = useState<S2tCommitItem | null>(null);
	const [deleteCommit, setDeleteCommit] = useState<S2tCommitItem | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const handleRefresh = () => {
		s2tCommitsQuery.refetch();
	};

	const handleDialogSaved = () => {
		s2tCommitsQuery.refetch();
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

	const s2tColumnDefs: ColDef<S2tCommitItem>[] = useMemo(
		() => [
			{
				headerName: "ID",
				field: "id",
				width: 220,
				pinned: "left",
				cellRenderer: (params: any) => (
					<Typography variant="body2" noWrap fontFamily="monospace">
						{params.value ? String(params.value).slice(0, 8) : "—"}
					</Typography>
				),
			},
			{
				headerName: "Название",
				field: "commit_name",
				width: 260,
				cellRenderer: (params: any) => (
					<Box sx={{ padding: 1 }}>
						<Typography variant="body2" noWrap>
							{params.value || "—"}
						</Typography>
					</Box>
				),
			},
			{
				headerName: "Тип",
				field: "type",
				width: 110,
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
				headerName: "Пользователь",
				field: "user",
				width: 160,
				cellRenderer: (params: any) => params.value || "—",
			},
			{
				headerName: "Создан",
				field: "created_at",
				width: 180,
				cellRenderer: (params: any) => {
					if (!params.value) return "—";
					return new Date(params.value).toLocaleString("ru-RU");
				},
			},
			{
				headerName: "Ошибка",
				field: "error",
				width: 260,
				cellRenderer: (params: any) => (
					<Typography
						variant="body2"
						noWrap
						color={params.value ? "error" : "text.secondary"}
					>
						{params.value || "—"}
					</Typography>
				),
			},
			{
				headerName: "Действия",
				field: "id",
				width: 180,
				sortable: false,
				filter: false,
				pinned: "right",
				cellRenderer: (params: any) => {
					console.log("🐸 Pepe said >> AllCommitsPage >> params:", params);

					const row = params.data as S2tCommitItem | undefined;
					if (!row) return null;
					return (
						<Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
							<IconButton
								size="small"
								title="Редактировать метаданные"
								onClick={(e) => {
									e.stopPropagation();
									setEditMetaCommit(row);
								}}
							>
								<EditIcon fontSize="small" />
							</IconButton>

							<IconButton
								title="Редактировать JSON"
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									setEditJsonCommit(row);
								}}
							>
								<CodeIcon fontSize="small" />
							</IconButton>

							<JsonViewerCell
								value={params.data?.payload}
								maxPreviewLength={80}
							/>

							<span title="Применить (merge)">
								<IconButton
									size="small"
									color="warning"
									disabled={row.state === "done"}
									onClick={(e) => {
										e.stopPropagation();
										setMergeCommit(row);
									}}
								>
									<MergeIcon fontSize="small" />
								</IconButton>
							</span>

							<span title="Удалить коммит">
								<IconButton
									size="small"
									color="error"
									disabled={row.state === "done"}
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

	const defaultColDef = useMemo(
		() => ({
			resizable: true,
			sortable: true,
			filter: true,
		}),
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

	if (error) {
		return (
			<Box sx={{ padding: 3 }}>
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={handleRefresh}>
							Повторить
						</Button>
					}
				>
					Ошибка загрузки коммитов: {error.message}
				</Alert>
			</Box>
		);
	}

	return (
		<Box>
			<Header>
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
						rowData={s2tCommits}
						columnDefs={s2tColumnDefs}
						defaultColDef={defaultColDef}
						onRowDoubleClicked={handleS2tRowDoubleClick}
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
				onClose={() => setEditJsonCommit(null)}
				onSaved={handleDialogSaved}
			/>
			<MergeCommitDialog
				open={!!mergeCommit}
				commit={mergeCommit}
				username={username}
				onClose={() => setMergeCommit(null)}
				onApplied={handleDialogSaved}
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
		</Box>
	);
};

const GridWrapper = styled(Flex)`
	zoom: 0.8;
	& > div {
		width: 100%;
	}
`;
