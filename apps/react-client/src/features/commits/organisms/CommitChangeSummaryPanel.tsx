import { memo, useMemo } from "react";
import { Box, Typography, Chip, Divider, Alert } from "@mui/material";
import { Flex } from "@react-client/common/primitives/Flex";
import { Card } from "@react-client/common/muiCustom/Card";
import {
	useCommitMergeStore,
	extractCommitEntities,
	extractCommitMappings,
} from "../stores/commitMergeStore";

export const CommitChangeSummaryPanel = memo(() => {
	const { commit } = useCommitMergeStore();

	const entities = useMemo(() => extractCommitEntities(commit), [commit]);
	const mappings = useMemo(() => extractCommitMappings(commit), [commit]);

	const stats = useMemo(() => {
		const total = entities.length;
		const modified = entities.filter((e) => e.modified).length;
		const sources = total - modified;

		const totalMappings = mappings.length;
		const totalDeps = mappings.reduce(
			(acc, m) => acc + (m.deps?.length ?? 0),
			0,
		);
		const totalAttrMaps = mappings.reduce(
			(acc, m) =>
				acc + (m.deps?.reduce((a, d) => a + (d.attrMaps?.length ?? 0), 0) ?? 0),
			0,
		);

		const entityTypes = new Map<string, number>();
		for (const e of entities) {
			const t = e.type || "unknown";
			entityTypes.set(t, (entityTypes.get(t) ?? 0) + 1);
		}

		const namespaces = new Set<string>();
		for (const e of entities) {
			if (e.namespace) namespaces.add(e.namespace);
		}

		return {
			total,
			modified,
			sources,
			totalMappings,
			totalDeps,
			totalAttrMaps,
			entityTypes,
			namespaces: namespaces.size,
		};
	}, [entities, mappings]);

	const isDone = commit?.state === "done";

	if (!commit) {
		return (
			<Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
				<Alert severity="info">Загрузка коммита...</Alert>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 2, height: "100%", overflow: "auto", fontSize: 12 }}>
			<Flex gap={10} flexDirection="column">
				{isDone && (
					<Alert severity="info" sx={{ fontSize: 11 }}>
						Коммит уже применён (change_id: {commit.change_id ?? "—"})
					</Alert>
				)}

				{commit.error && (
					<Alert severity="error" sx={{ fontSize: 11 }}>
						{commit.error}
					</Alert>
				)}

				<Card title="Информация о коммите">
					<Flex gap={6} flexDirection="column">
						<Box>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: "block" }}
							>
								Наименование
							</Typography>
							<Typography variant="body2" fontWeight={600}>
								{commit.commit_name || "—"}
							</Typography>
						</Box>
						{commit.commit_description && (
							<Box>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ display: "block" }}
								>
									Описание
								</Typography>
								<Typography variant="body2">
									{commit.commit_description}
								</Typography>
							</Box>
						)}
						<Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
							<Chip
								label={commit.state === "done" ? "Применён" : commit.state}
								size="small"
								color={
									commit.state === "done"
										? "success"
										: commit.state === "failed"
											? "error"
											: "warning"
								}
							/>
							<Chip label={commit.type} size="small" variant="outlined" />
							{commit.user && (
								<Chip
									label={commit.user}
									size="small"
									variant="outlined"
									color="info"
								/>
							)}
						</Box>
						<Typography variant="caption" color="text.secondary">
							ID: {commit.id}
						</Typography>
						{commit.updated_at && (
							<Typography variant="caption" color="text.secondary">
								Обновлён: {new Date(commit.updated_at).toLocaleString("ru-RU")}
							</Typography>
						)}
					</Flex>
				</Card>

				<Divider />

				<Card title="Статистика изменений">
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 1.5,
						}}
					>
						<StatItem label="Всего сущностей" value={stats.total} />
						<StatItem
							label="Изменённых"
							value={stats.modified}
							color="warning"
						/>
						<StatItem label="Источников" value={stats.sources} color="info" />
						<StatItem
							label="Маппингов"
							value={stats.totalMappings}
							color="secondary"
						/>
						<StatItem label="Зависимостей" value={stats.totalDeps} />
						<StatItem label="Атрибутных связей" value={stats.totalAttrMaps} />
						<StatItem label="Namespaces" value={stats.namespaces} />
					</Box>
				</Card>

				{stats.entityTypes.size > 0 && (
					<Card title="Типы сущностей">
						<Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
							{Array.from(stats.entityTypes.entries()).map(([type, count]) => (
								<Chip
									key={type}
									label={`${type}: ${count}`}
									size="small"
									variant="outlined"
								/>
							))}
						</Box>
					</Card>
				)}
			</Flex>
		</Box>
	);
});

CommitChangeSummaryPanel.displayName = "CommitChangeSummaryPanel";

const StatItem = ({
	label,
	value,
	color,
}: {
	label: string;
	value: number;
	color?: "warning" | "info" | "secondary" | "error";
}) => (
	<Box>
		<Typography
			variant="caption"
			color="text.secondary"
			sx={{ display: "block" }}
		>
			{label}
		</Typography>
		<Chip
			label={value}
			size="small"
			color={color ?? "default"}
			variant={color ? "filled" : "outlined"}
		/>
	</Box>
);
