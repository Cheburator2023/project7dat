import { useCallback, useMemo } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { format } from "date-fns/esm";
import { toast } from "sonner";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Card } from "@react-client/common/muiCustom/Card";
import { useDashboardStore } from "@react-client/features/dashboard/stores";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useAuthStore } from "@react-client/common/store/authStore";

const sanitizeFilePart = (value: string) =>
	value.replace(/[^a-zA-Z0-9._-]+/g, "_");

const buildDefaultFileName = (params: {
	schemaName?: string;
	entityName: string;
	extension: "xlsx";
}) => {
	const timestamp = format(new Date(), "yyMMddHHmm");
	const schemaPart = params.schemaName
		? sanitizeFilePart(params.schemaName)
		: "";
	const entityPart = sanitizeFilePart(params.entityName);
	const base = schemaPart ? `${schemaPart}.${entityPart}` : entityPart;
	return `${base}${timestamp}.${params.extension}`;
};

const getFileNameFromContentDisposition = (value: string | null) => {
	if (!value) return null;

	const parts = value.split(";").map((p) => p.trim());
	const filenameStar = parts.find((p) =>
		p.toLowerCase().startsWith("filename*="),
	);
	if (filenameStar) {
		const raw = filenameStar.split("=")[1] ?? "";
		const cleaned = raw.replace(/^UTF-8''/i, "").replace(/^"|"$/g, "");
		try {
			return decodeURIComponent(cleaned);
		} catch {
			return cleaned;
		}
	}

	const filename = parts.find((p) => p.toLowerCase().startsWith("filename="));
	if (!filename) return null;
	return (filename.split("=")[1] ?? "").replace(/^"|"$/g, "");
};

const downloadBlob = (params: { blob: Blob; fileName: string }) => {
	const url = URL.createObjectURL(params.blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = params.fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

export const S2tDataReportPage = () => {
	const { selectedEntityId } = useDashboardStore();
	const { currentGraph } = useDataLineageStore();
	const { accessToken } = useAuthStore();

	const derived = useMemo(() => {
		if (!currentGraph || !selectedEntityId) {
			return {
				entity: null,
				fileName: null as string | null,
				isAllowedEntityType: false,
			};
		}

		const entity =
			currentGraph.entities.find((e) => e.id === selectedEntityId) ?? null;
		const isAllowedEntityType =
			entity?.type === "table" || entity?.type === "view";
		const fileName = entity
			? buildDefaultFileName({
					entityName: entity.name ?? entity.id,
					schemaName: entity.namespace,
					extension: "xlsx",
				})
			: null;

		return { entity, fileName, isAllowedEntityType };
	}, [currentGraph, selectedEntityId]);

	const handleDownload = useCallback(async () => {
		const API_BASE_URL =
			window.urlConfig?.DATA_LINEAGE_API || "http://localhost:3000";
		if (!selectedEntityId) {
			toast.error("Сначала выбери витрину (таблицу или view) на главной");
			return;
		}
		if (!derived.entity || !derived.isAllowedEntityType) {
			toast.error("Отчёт доступен только для сущностей типа table или view");
			return;
		}

		try {
			const url = new URL(`${API_BASE_URL}/api/s2t-export/dl`);
			url.searchParams.set("entityId", selectedEntityId);

			const res = await fetch(url.toString(), {
				method: "GET",
				headers: {
					...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
				},
			});

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}

			const blob = await res.blob();
			const cd = res.headers.get("content-disposition");
			const responseFileName = getFileNameFromContentDisposition(cd);
			downloadBlob({
				blob,
				fileName: responseFileName ?? derived.fileName ?? "report.xlsx",
			});
		} catch (e: any) {
			toast.error(`Не удалось скачать отчёт: ${e?.message ?? "ошибка"}`);
		}
	}, [accessToken, derived, selectedEntityId]);

	return (
		<Box>
			<Header title={"Отчёт: Формат S2T"} />
			<Box sx={{ p: 2 }}>
				<Card>
					<Stack spacing={2}>
						<Typography variant="body1">
							Выгрузка файла отчёта для выбранной витрины в формате S2T (.xlsx).
						</Typography>

						{!selectedEntityId && (
							<Alert severity="warning">
								Сначала выбери витрину (таблицу или view) на главной странице.
							</Alert>
						)}

						{selectedEntityId && !derived.entity && (
							<Alert severity="error">
								Не удалось найти выбранную сущность в текущем графе.
							</Alert>
						)}

						{derived.entity && (
							<Alert
								severity={derived.isAllowedEntityType ? "info" : "warning"}
							>
								<Box
									sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
								>
									<Typography variant="subtitle2">Выбранная витрина</Typography>
									<Typography variant="body2">
										Схема: {derived.entity.namespace || "—"}
									</Typography>
									<Typography variant="body2">
										Таблица/view: {derived.entity.name ?? derived.entity.id}
									</Typography>
									<Typography variant="body2">
										Тип: {derived.entity.type}
									</Typography>
									{derived.fileName && (
										<Typography variant="body2">
											Имя файла: {derived.fileName}
										</Typography>
									)}
								</Box>
							</Alert>
						)}

						<Button
							variant="contained"
							onClick={handleDownload}
							disabled={!derived.entity || !derived.isAllowedEntityType}
						>
							Скачать отчёт (.xlsx)
						</Button>
					</Stack>
				</Card>
			</Box>
		</Box>
	);
};
