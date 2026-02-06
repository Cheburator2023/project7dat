import React from "react";
import {
	styled,
	Box,
	Typography,
	Chip,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router";
import type { ObjectItem } from "../types";
import { getHighlightedText } from "@react-client/features/dashboard/utils/fuzzySearch";

interface ObjectRelatedViewProps {
	object: ObjectItem | null;
	relatedObjects: ObjectItem[];
	searchQuery?: string;
}

export const ObjectRelatedView: React.FC<ObjectRelatedViewProps> = ({
	object,
	relatedObjects,
	searchQuery,
}) => {
	const navigate = useNavigate();
	const isHighlightActive = (searchQuery?.trim().length ?? 0) >= 3;

	const getTypeColor = (type: string) => {
		switch (type) {
			case "Источник":
				return "primary";
			case "Витрина":
				return "warning";
			case "Признак":
				return "success";
			default:
				return "default";
		}
	};

	if (!object) {
		return (
			<Container>
				<Typography variant="body1" color="text.secondary">
					Объект не выбран
				</Typography>
			</Container>
		);
	}

	const isAttribute = object.objectType === "Признак";
	const title = isAttribute ? "Родительская модель" : "Признаки";
	const emptyMessage = isAttribute
		? "Родительская модель не найдена"
		: "Признаки не найдены";

	return (
		<Container>
			<ContentContainer>
				{/* Related Objects */}
				<CompactAccordion defaultExpanded>
					<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
						<AccordionTitle>
							{title} ({relatedObjects.length})
						</AccordionTitle>
					</CompactAccordionSummary>
					<CompactAccordionDetails>
						{relatedObjects.length > 0 ? (
							<TableContainer component={Paper} variant="outlined">
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 600 }}>Название</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>Описание</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{relatedObjects.map((obj) => (
											<ClickableTableRow
												key={obj.id}
												onClick={() =>
													navigate(`/objects/${encodeURIComponent(obj.id)}`)
												}
											>
												<TableCell
													sx={{ fontFamily: "monospace", fontSize: 12 }}
												>
													{isHighlightActive ? (
														<span
															dangerouslySetInnerHTML={{
																__html: getHighlightedText(
																	obj.object,
																	searchQuery ?? "",
																),
															}}
														/>
													) : (
														obj.object
													)}
												</TableCell>
												<TableCell>
													<Chip
														label={obj.objectType}
														size="small"
														color={getTypeColor(obj.objectType) as any}
													/>
												</TableCell>
												<TableCell>
													{obj.description ? (
														isHighlightActive ? (
															<span
																dangerouslySetInnerHTML={{
																	__html: getHighlightedText(
																		obj.description,
																		searchQuery ?? "",
																	),
																}}
															/>
														) : (
															obj.description
														)
													) : (
														"—"
													)}
												</TableCell>
											</ClickableTableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						) : (
							<Typography variant="body2" color="text.secondary">
								{emptyMessage}
							</Typography>
						)}
					</CompactAccordionDetails>
				</CompactAccordion>

				{/* Quick Navigation Chips */}
				{relatedObjects.length > 0 && (
					<CompactAccordion>
						<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
							<AccordionTitle>Быстрая навигация</AccordionTitle>
						</CompactAccordionSummary>
						<CompactAccordionDetails>
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
								{relatedObjects.map((obj) => (
									<Chip
										key={obj.id}
										label={
											isHighlightActive ? (
												<span
													dangerouslySetInnerHTML={{
														__html: getHighlightedText(
															obj.object,
															searchQuery ?? "",
														),
													}}
												/>
											) : (
												obj.object
											)
										}
										size="small"
										variant="outlined"
										onClick={() =>
											navigate(`/objects/${encodeURIComponent(obj.id)}`)
										}
										sx={{ cursor: "pointer" }}
									/>
								))}
							</Box>
						</CompactAccordionDetails>
					</CompactAccordion>
				)}
			</ContentContainer>
		</Container>
	);
};

const Container = styled(Box)(({ theme }) => ({
	height: "100%",
	display: "flex",
	flexDirection: "column",
	padding: theme.spacing(0.5),
}));

const ContentContainer = styled(Box)(({ theme }) => ({
	flex: 1,
	overflow: "auto",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(0.5),
}));

const CompactAccordion = styled(Accordion)({
	"&:before": { display: "none" },
	boxShadow: "none",
	border: "1px solid",
	borderColor: "rgba(0, 0, 0, 0.12)",
	borderRadius: "4px !important",
	"&:not(:last-child)": { marginBottom: 0 },
	"&.Mui-expanded": { margin: 0 },
});

const CompactAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
	minHeight: 32,
	padding: theme.spacing(0, 1),
	"&.Mui-expanded": { minHeight: 32 },
	"& .MuiAccordionSummary-content": {
		margin: theme.spacing(0.5, 0),
		"&.Mui-expanded": { margin: theme.spacing(0.5, 0) },
	},
	"& .MuiAccordionSummary-expandIconWrapper": {
		"& .MuiSvgIcon-root": { fontSize: 18 },
	},
}));

const CompactAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
	padding: theme.spacing(0.5, 1, 1, 1),
}));

const AccordionTitle = styled(Typography)({
	fontSize: 12,
	fontWeight: 600,
});

const ClickableTableRow = styled(TableRow)(({ theme }) => ({
	cursor: "pointer",
	"&:hover": {
		backgroundColor: theme.vars?.palette?.action.hover,
	},
}));
