import React from "react";
import {
	styled,
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableRow,
	Paper,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { ObjectItem } from "../types";
import { TypeChip } from "@react-client/features/dashboard/atoms";

interface ObjectDetailsViewProps {
	object: ObjectItem | null;
}

export const ObjectDetailsView: React.FC<ObjectDetailsViewProps> = ({
	object,
}) => {
	const _getTypeColor = (type: string) => {
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

	return (
		<Container>
			<ContentContainer>
				{/* Basic Information */}
				<CompactAccordion defaultExpanded>
					<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
						<AccordionTitle>Основная информация</AccordionTitle>
					</CompactAccordionSummary>
					<CompactAccordionDetails>
						<TableContainer component={Paper} variant="outlined">
							<Table size="small">
								<TableBody>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600, width: 180 }}
										>
											Название
										</TableCell>
										<TableCell>{object.object}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											Тип
										</TableCell>
										<TableCell>
											<TypeChip type={object.objectType} />
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											Описание
										</TableCell>
										<TableCell>{object.description || "—"}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											ID объекта
										</TableCell>
										<TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
											{object.id}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</TableContainer>
					</CompactAccordionDetails>
				</CompactAccordion>

				{/* Process Information */}
				<CompactAccordion defaultExpanded>
					<CompactAccordionSummary expandIcon={<ExpandMoreIcon />}>
						<AccordionTitle>Информация о процессе</AccordionTitle>
					</CompactAccordionSummary>
					<CompactAccordionDetails>
						<TableContainer component={Paper} variant="outlined">
							<Table size="small">
								<TableBody>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600, width: 180 }}
										>
											Процесс
										</TableCell>
										<TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
											{object.process}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell
											component="th"
											scope="row"
											sx={{ fontWeight: 600 }}
										>
											Описание процесса
										</TableCell>
										<TableCell>{object.processDescription || "—"}</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</TableContainer>
					</CompactAccordionDetails>
				</CompactAccordion>
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
