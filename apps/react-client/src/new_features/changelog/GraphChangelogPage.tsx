import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
	Box,
	Typography,
	Paper,
	Chip,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	TextField,
	Button,
	Stack,
	Pagination,
	CircularProgress,
	Alert,
} from "@mui/material";
import {
	ExpandMore as ExpandMoreIcon,
	History as HistoryIcon,
} from "@mui/icons-material";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { useChangelog } from "@react-client/api/hooks";
import {
	ChangelogEntry,
	ChangelogGroup,
} from "@react-client/api/hooks/changelogApi";

const getActionTypeColor = (actionType: string) => {
	switch (actionType) {
		case "CREATED":
			return "success";
		case "COMMIT":
			return "primary";
		case "SNAPSHOT_CREATED":
			return "info";
		case "SNAPSHOT_APPLIED":
			return "warning";
		case "ROLLBACK":
			return "error";
		case "SET_CURRENT":
			return "secondary";
		case "UPDATED":
			return "default";
		case "DELETED":
			return "error";
		default:
			return "default";
	}
};

const getActionTypeLabel = (actionType: string) => {
	switch (actionType) {
		case "CREATED":
			return "Создан";
		case "COMMIT":
			return "Коммит";
		case "SNAPSHOT_CREATED":
			return "Снапшот создан";
		case "SNAPSHOT_APPLIED":
			return "Снапшот применен";
		case "ROLLBACK":
			return "Откат";
		case "SET_CURRENT":
			return "Установлен текущим";
		case "UPDATED":
			return "Обновлен";
		case "DELETED":
			return "Удален";
		default:
			return actionType;
	}
};

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("ru-RU", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

const formatTime = (dateString: string) => {
	return new Date(dateString).toLocaleTimeString("ru-RU", {
		hour: "2-digit",
		minute: "2-digit",
	});
};

interface ChangelogEntryItemProps {
	entry: ChangelogEntry;
}

const ChangelogEntryItem = ({ entry }: ChangelogEntryItemProps) => {
	return (
		<Paper sx={{ p: 2, mb: 1 }}>
			<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
				<Chip
					label={getActionTypeLabel(entry.actionType)}
					color={getActionTypeColor(entry.actionType) as any}
					size="small"
				/>
				<Typography variant="body2" color="text.secondary">
					{formatTime(entry.createdAt)}
				</Typography>
			</Stack>

			<Typography variant="body1" sx={{ mb: 1 }}>
				{entry.actionDescription}
			</Typography>

			{entry.details && Object.keys(entry.details).length > 0 && (
				<Box sx={{ mt: 1 }}>
					<Typography variant="caption" color="text.secondary">
						Детали:
					</Typography>
					<Box
						component="pre"
						sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.5 }}
					>
						{JSON.stringify(entry.details, null, 2)}
					</Box>
				</Box>
			)}

			{entry.author && (
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ display: "block", mt: 1 }}
				>
					Автор: {entry.author}
				</Typography>
			)}
		</Paper>
	);
};

interface ChangelogGroupItemProps {
	group: ChangelogGroup;
}

const ChangelogGroupItem = ({ group }: ChangelogGroupItemProps) => {
	return (
		<Accordion defaultExpanded>
			<AccordionSummary expandIcon={<ExpandMoreIcon />}>
				<Stack direction="row" spacing={2} alignItems="center">
					<HistoryIcon color="primary" />
					<Typography variant="h6">{formatDate(group.date)}</Typography>
					<Chip label={`${group.entries.length} событий`} size="small" />
				</Stack>
			</AccordionSummary>
			<AccordionDetails>
				<Stack spacing={1}>
					{group.entries.map((entry) => (
						<ChangelogEntryItem key={entry.id} entry={entry} />
					))}
				</Stack>
			</AccordionDetails>
		</Accordion>
	);
};

export const GraphChangelogPage = () => {
	const { graphId } = useParams<{ graphId: string }>();
	const navigate = useNavigate();
	const { loading, error, getChangelogForGraph } = useChangelog();
	const [groups, setGroups] = useState<ChangelogGroup[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [authorFilter, setAuthorFilter] = useState("");
	const [dateFromFilter, setDateFromFilter] = useState("");
	const [dateToFilter, setDateToFilter] = useState("");
	const [_graphName, setGraphName] = useState("");

	const limit = 20;

	const loadChangelog = async () => {
		if (!graphId) return;

		const params = {
			page,
			limit,
			...(authorFilter && { author: authorFilter }),
			...(dateFromFilter && { dateFrom: dateFromFilter }),
			...(dateToFilter && { dateTo: dateToFilter }),
		};

		const response = await getChangelogForGraph(graphId, params);
		if (response) {
			setGroups(response.groups);
			setTotalPages(Math.ceil(response.total / limit));

			if (response.groups.length > 0 && response.groups[0].entries.length > 0) {
				setGraphName(response.groups[0].entries[0].graphName);
			}
		}
	};

	useEffect(() => {
		loadChangelog();
	}, [page, graphId]);

	const handleFilterApply = () => {
		setPage(1);
		loadChangelog();
	};

	const handleFilterReset = () => {
		setAuthorFilter("");
		setDateFromFilter("");
		setDateToFilter("");
		setPage(1);
		loadChangelog();
	};

	const _handleBack = () => {
		navigate(-1);
	};

	if (!graphId) {
		return <Alert severity="error">ID графика не указан</Alert>;
	}

	return (
		<Box>
			<Header />

			<Paper sx={{ p: 2, mb: 3 }}>
				<Typography variant="h6" sx={{ mb: 2 }}>
					Фильтры
				</Typography>
				<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
					<TextField
						label="Автор"
						value={authorFilter}
						onChange={(e) => setAuthorFilter(e.target.value)}
						size="small"
						sx={{ minWidth: 200 }}
					/>
					<TextField
						label="Дата от"
						type="date"
						value={dateFromFilter}
						onChange={(e) => setDateFromFilter(e.target.value)}
						size="small"
						InputLabelProps={{ shrink: true }}
					/>
					<TextField
						label="Дата до"
						type="date"
						value={dateToFilter}
						onChange={(e) => setDateToFilter(e.target.value)}
						size="small"
						InputLabelProps={{ shrink: true }}
					/>
				</Stack>
				<Stack direction="row" spacing={2}>
					<Button variant="contained" onClick={handleFilterApply}>
						Применить
					</Button>
					<Button variant="outlined" onClick={handleFilterReset}>
						Сбросить
					</Button>
				</Stack>
			</Paper>

			{loading && (
				<Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
					<CircularProgress />
				</Box>
			)}

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			{!loading && !error && groups.length === 0 && (
				<Alert severity="info">
					Нет записей в истории изменений для этого графика
				</Alert>
			)}

			{!loading && !error && groups.length > 0 && (
				<>
					<Stack spacing={2}>
						{groups.map((group) => (
							<ChangelogGroupItem key={group.date} group={group} />
						))}
					</Stack>

					{totalPages > 1 && (
						<Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
							<Pagination
								count={totalPages}
								page={page}
								onChange={(_, newPage) => setPage(newPage)}
								color="primary"
							/>
						</Box>
					)}
				</>
			)}
		</Box>
	);
};
