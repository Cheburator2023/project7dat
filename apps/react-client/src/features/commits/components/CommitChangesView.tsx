import React, { useState } from "react";
import {
	Box,
	Typography,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Chip,
	List,
	ListItem,
	ListItemText,
	useColorScheme,
} from "@mui/material";
import {
	ExpandMore as ExpandMoreIcon,
	Add as AddIcon,
	Remove as RemoveIcon,
	Edit as EditIcon,
} from "@mui/icons-material";
import type { CommitChanges } from "@react-client/api/hooks/jsonDataApi";
import { fastStringify } from "@react-client/shared/src";

interface CommitChangesViewProps {
	changes: CommitChanges | null | undefined;
	showDetails?: boolean;
}

/**
 * Компонент для детального отображения изменений коммита
 */
export const CommitChangesView: React.FC<CommitChangesViewProps> = ({
	changes,
	showDetails = true,
}) => {
	const { mode } = useColorScheme();
	const [expandedSection, setExpandedSection] = useState<string | false>(
		"entities",
	);

	if (!changes) {
		return (
			<Typography variant="body2" color="text.secondary">
				Нет данных об изменениях
			</Typography>
		);
	}

	const { entities, mappings, summary } = changes;

	const handleAccordionChange =
		(panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
			setExpandedSection(isExpanded ? panel : false);
		};

	const renderFieldChanges = (
		fieldChanges: Array<{ field: string; oldValue: any; newValue: any }>,
	) => {
		return (
			<List dense disablePadding>
				{fieldChanges.map((change, index) => (
					<ListItem key={index} sx={{ py: 0.5 }}>
						<ListItemText
							primary={
								<Typography variant="caption" fontWeight="bold">
									{change.field}
								</Typography>
							}
							secondary={
								<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
									<Typography
										variant="caption"
										sx={{
											backgroundColor: mode === "dark" ? "#4a2020" : "#ffecec",
											px: 0.5,
											borderRadius: 0.5,
											textDecoration: "line-through",
										}}
									>
										{typeof change.oldValue === "object"
											? fastStringify(change.oldValue)
											: String(change.oldValue ?? "null")}
									</Typography>
									<Typography variant="caption">→</Typography>
									<Typography
										variant="caption"
										sx={{
											backgroundColor: mode === "dark" ? "#1a3a1a" : "#e8f5e8",
											px: 0.5,
											borderRadius: 0.5,
										}}
									>
										{typeof change.newValue === "object"
											? fastStringify(change.newValue)
											: String(change.newValue ?? "null")}
									</Typography>
								</Box>
							}
						/>
					</ListItem>
				))}
			</List>
		);
	};

	return (
		<Box>
			{/* Summary */}
			<Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
				<Chip
					size="small"
					label={`Всего: ${summary.totalChanges} изменений`}
					color="primary"
				/>
			</Box>

			{/* Entities Section */}
			<Accordion
				expanded={expandedSection === "entities"}
				onChange={handleAccordionChange("entities")}
				sx={{ mb: 1 }}
			>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Typography variant="subtitle2">Сущности</Typography>
						{summary.entities.added > 0 && (
							<Chip
								size="small"
								icon={<AddIcon sx={{ fontSize: 14 }} />}
								label={summary.entities.added}
								color="success"
								sx={{ height: 20 }}
							/>
						)}
						{summary.entities.removed > 0 && (
							<Chip
								size="small"
								icon={<RemoveIcon sx={{ fontSize: 14 }} />}
								label={summary.entities.removed}
								color="error"
								sx={{ height: 20 }}
							/>
						)}
						{summary.entities.modified > 0 && (
							<Chip
								size="small"
								icon={<EditIcon sx={{ fontSize: 14 }} />}
								label={summary.entities.modified}
								color="warning"
								sx={{ height: 20 }}
							/>
						)}
					</Box>
				</AccordionSummary>
				<AccordionDetails>
					{/* Added Entities */}
					{entities.added.length > 0 && (
						<Box sx={{ mb: 2 }}>
							<Typography
								variant="caption"
								color="success.main"
								fontWeight="bold"
							>
								Добавлено ({entities.added.length})
							</Typography>
							<List dense>
								{entities.added.map((entity) => (
									<ListItem key={entity.id}>
										<ListItemText
											primary={entity.name || entity.id}
											secondary={
												<>
													<Chip
														size="small"
														label={entity.type}
														sx={{ mr: 1, height: 16, fontSize: 10 }}
													/>
													{entity.namespace && (
														<Typography
															variant="caption"
															color="text.secondary"
														>
															{entity.namespace}
														</Typography>
													)}
												</>
											}
										/>
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{/* Removed Entities */}
					{entities.removed.length > 0 && (
						<Box sx={{ mb: 2 }}>
							<Typography
								variant="caption"
								color="error.main"
								fontWeight="bold"
							>
								Удалено ({entities.removed.length})
							</Typography>
							<List dense>
								{entities.removed.map((entity) => (
									<ListItem key={entity.id}>
										<ListItemText
											primary={
												<Typography
													sx={{ textDecoration: "line-through" }}
													color="text.secondary"
												>
													{entity.name || entity.id}
												</Typography>
											}
											secondary={entity.type}
										/>
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{/* Modified Entities */}
					{entities.modified.length > 0 && showDetails && (
						<Box>
							<Typography
								variant="caption"
								color="warning.main"
								fontWeight="bold"
							>
								Изменено ({entities.modified.length})
							</Typography>
							<List dense>
								{entities.modified.map((entity) => (
									<ListItem
										key={entity.id}
										sx={{ flexDirection: "column", alignItems: "flex-start" }}
									>
										<ListItemText
											primary={entity.name || entity.id}
											secondary={
												<Chip
													size="small"
													label={entity.type}
													sx={{ height: 16, fontSize: 10 }}
												/>
											}
										/>
										{entity.changes && entity.changes.length > 0 && (
											<Box sx={{ pl: 2, width: "100%" }}>
												{renderFieldChanges(entity.changes)}
											</Box>
										)}
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{entities.added.length === 0 &&
						entities.removed.length === 0 &&
						entities.modified.length === 0 && (
							<Typography variant="body2" color="text.secondary">
								Нет изменений в сущностях
							</Typography>
						)}
				</AccordionDetails>
			</Accordion>

			{/* Mappings Section */}
			<Accordion
				expanded={expandedSection === "mappings"}
				onChange={handleAccordionChange("mappings")}
			>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Typography variant="subtitle2">Связи (Mappings)</Typography>
						{summary.mappings.added > 0 && (
							<Chip
								size="small"
								icon={<AddIcon sx={{ fontSize: 14 }} />}
								label={summary.mappings.added}
								color="success"
								sx={{ height: 20 }}
							/>
						)}
						{summary.mappings.removed > 0 && (
							<Chip
								size="small"
								icon={<RemoveIcon sx={{ fontSize: 14 }} />}
								label={summary.mappings.removed}
								color="error"
								sx={{ height: 20 }}
							/>
						)}
						{summary.mappings.modified > 0 && (
							<Chip
								size="small"
								icon={<EditIcon sx={{ fontSize: 14 }} />}
								label={summary.mappings.modified}
								color="warning"
								sx={{ height: 20 }}
							/>
						)}
					</Box>
				</AccordionSummary>
				<AccordionDetails>
					{/* Added Mappings */}
					{mappings.added.length > 0 && (
						<Box sx={{ mb: 2 }}>
							<Typography
								variant="caption"
								color="success.main"
								fontWeight="bold"
							>
								Добавлено ({mappings.added.length})
							</Typography>
							<List dense>
								{mappings.added.map((mapping) => (
									<ListItem key={mapping.id}>
										<ListItemText
											primary={`Mapping #${mapping.id}`}
											secondary={`Entity: ${mapping.entityId}`}
										/>
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{/* Removed Mappings */}
					{mappings.removed.length > 0 && (
						<Box sx={{ mb: 2 }}>
							<Typography
								variant="caption"
								color="error.main"
								fontWeight="bold"
							>
								Удалено ({mappings.removed.length})
							</Typography>
							<List dense>
								{mappings.removed.map((mapping) => (
									<ListItem key={mapping.id}>
										<ListItemText
											primary={
												<Typography
													sx={{ textDecoration: "line-through" }}
													color="text.secondary"
												>
													Mapping #{mapping.id}
												</Typography>
											}
											secondary={
												mapping.entityId ? `Entity: ${mapping.entityId}` : ""
											}
										/>
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{/* Modified Mappings */}
					{mappings.modified.length > 0 && showDetails && (
						<Box>
							<Typography
								variant="caption"
								color="warning.main"
								fontWeight="bold"
							>
								Изменено ({mappings.modified.length})
							</Typography>
							<List dense>
								{mappings.modified.map((mapping) => (
									<ListItem
										key={mapping.id}
										sx={{ flexDirection: "column", alignItems: "flex-start" }}
									>
										<ListItemText
											primary={`Mapping #${mapping.id}`}
											secondary={`Entity: ${mapping.entityId}`}
										/>
										{mapping.changes && mapping.changes.length > 0 && (
											<Box sx={{ pl: 2, width: "100%" }}>
												{renderFieldChanges(mapping.changes)}
											</Box>
										)}
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{mappings.added.length === 0 &&
						mappings.removed.length === 0 &&
						mappings.modified.length === 0 && (
							<Typography variant="body2" color="text.secondary">
								Нет изменений в связях
							</Typography>
						)}
				</AccordionDetails>
			</Accordion>
		</Box>
	);
};
