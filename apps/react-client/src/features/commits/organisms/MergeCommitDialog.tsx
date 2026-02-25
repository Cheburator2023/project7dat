import { useState, useMemo } from "react";
import type { FC } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	CircularProgress,
	Alert,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Typography,
	Box,
	Tab,
	Tabs,
	Chip,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	TextField,
} from "@mui/material";
import type { S2tCommitItem } from "@react-client/api/hooks/s2tCommitStoreApi";
import {
	s2tCommitStoreService,
	type ApplyS2tCommitPayload,
} from "@react-client/api/hooks/s2tCommitStoreApi";

interface MergeCommitDialogProps {
	open: boolean;
	commit: S2tCommitItem | null;
	username: string;
	onClose: () => void;
	onApplied: () => void;
}

interface CommitEntity {
	id: string;
	name?: string;
	type?: string;
	modified?: boolean;
	namespace?: string;
	attrSeq?: Array<{ name: string; type: string; comment?: string }>;
}

export const MergeCommitDialog: FC<MergeCommitDialogProps> = ({
	open,
	commit,
	username,
	onClose,
	onApplied,
}) => {
	const [sourceType, setSourceType] = useState<"SURM" | "DAPP">("DAPP");
	const [applying, setApplying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState(0);
	const [entitySearch, setEntitySearch] = useState("");

	const handleApply = async () => {
		if (!commit) return;
		setApplying(true);
		setError(null);
		try {
			await s2tCommitStoreService.apply(commit.id, {
				user: username,
				sourceType,
			} satisfies ApplyS2tCommitPayload);
			onApplied();
			onClose();
		} catch (err: any) {
			setError(
				err?.response?.data?.message ?? err?.message ?? "Ошибка применения",
			);
		} finally {
			setApplying(false);
		}
	};

	const isDone = commit?.state === "done" || commit?.state === "failed";

	const commitEntities = useMemo<CommitEntity[]>(() => {
		const payload = commit?.payload as Record<string, unknown> | null;
		if (!payload) return [];
		const entities = (payload.entities ?? []) as CommitEntity[];
		return Array.isArray(entities) ? entities : [];
	}, [commit?.payload]);

	const commitMappings = useMemo(() => {
		const payload = commit?.payload as Record<string, unknown> | null;
		if (!payload) return [];
		const mappings = (payload.mappings ?? []) as Array<Record<string, unknown>>;
		return Array.isArray(mappings) ? mappings : [];
	}, [commit?.payload]);

	const filteredEntities = useMemo(() => {
		if (!entitySearch.trim()) return commitEntities;
		const q = entitySearch.toLowerCase();
		return commitEntities.filter(
			(e) =>
				e.id?.toLowerCase().includes(q) ||
				e.name?.toLowerCase().includes(q) ||
				e.namespace?.toLowerCase().includes(q),
		);
	}, [commitEntities, entitySearch]);

	const stats = useMemo(() => {
		const total = commitEntities.length;
		const modified = commitEntities.filter((e) => e.modified).length;
		const source = total - modified;
		return { total, modified, source, mappings: commitMappings.length };
	}, [commitEntities, commitMappings]);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
			<DialogTitle>Предпросмотр и применение коммита</DialogTitle>
			<DialogContent
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 2,
					pt: "8px !important",
					minHeight: 400,
				}}
			>
				{error && <Alert severity="error">{error}</Alert>}
				{isDone && (
					<Alert severity="info">
						Коммит уже применён (change_id: {commit?.change_id ?? "—"})
					</Alert>
				)}

				<Box
					sx={{
						display: "flex",
						gap: 1,
						flexWrap: "wrap",
						alignItems: "center",
					}}
				>
					<Typography variant="body2" color="text.secondary">
						Коммит: <b>{commit?.commit_name}</b> ({commit?.id.slice(0, 8)})
					</Typography>
					<Chip label={`${stats.total} сущностей`} size="small" />
					<Chip
						label={`${stats.modified} изменённых`}
						size="small"
						color="warning"
					/>
					<Chip
						label={`${stats.source} источников`}
						size="small"
						color="info"
					/>
					<Chip
						label={`${stats.mappings} маппингов`}
						size="small"
						variant="outlined"
					/>
				</Box>

				<Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
					<Tab label="Предпросмотр сущностей" />
					<Tab label="Применение (merge)" />
				</Tabs>

				{activeTab === 0 && (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
						<TextField
							size="small"
							placeholder="Поиск по ID, имени, namespace..."
							value={entitySearch}
							onChange={(e) => setEntitySearch(e.target.value)}
							fullWidth
						/>
						<TableContainer
							component={Paper}
							variant="outlined"
							sx={{ maxHeight: 400 }}
						>
							<Table size="small" stickyHeader>
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Имя</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Namespace</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Атрибуты</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{filteredEntities.map((entity) => (
										<TableRow
											key={entity.id}
											sx={
												entity.modified
													? {
															backgroundColor: "warning.light",
															"& td": { color: "warning.contrastText" },
														}
													: undefined
											}
										>
											<TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>
												{entity.id}
											</TableCell>
											<TableCell>{entity.name || "—"}</TableCell>
											<TableCell>
												<Chip
													label={entity.type || "—"}
													size="small"
													variant="outlined"
												/>
											</TableCell>
											<TableCell>{entity.namespace || "—"}</TableCell>
											<TableCell>{entity.attrSeq?.length ?? 0}</TableCell>
											<TableCell>
												{entity.modified ? (
													<Chip label="Изменён" size="small" color="warning" />
												) : (
													<Chip
														label="Источник"
														size="small"
														color="default"
														variant="outlined"
													/>
												)}
											</TableCell>
										</TableRow>
									))}
									{filteredEntities.length === 0 && (
										<TableRow>
											<TableCell colSpan={6} align="center">
												<Typography variant="body2" color="text.secondary">
													{commitEntities.length === 0
														? "Нет сущностей в коммите"
														: "Ничего не найдено"}
												</Typography>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				)}

				{activeTab === 1 && (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						<FormControl fullWidth size="small">
							<InputLabel>Тип импорта</InputLabel>
							<Select
								value={sourceType}
								label="Тип импорта"
								onChange={(e) =>
									setSourceType(e.target.value as "SURM" | "DAPP")
								}
								disabled={applying}
							>
								<MenuItem value="DAPP">DAPP</MenuItem>
								<MenuItem value="SURM">SURM</MenuItem>
							</Select>
						</FormControl>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={applying}>
					Отмена
				</Button>
				<Button
					onClick={handleApply}
					variant="contained"
					color="warning"
					disabled={applying || isDone}
					startIcon={applying ? <CircularProgress size={16} /> : undefined}
				>
					Применить (merge)
				</Button>
			</DialogActions>
		</Dialog>
	);
};
