import { useCallback } from "react";
import { useAuthStore } from "@react-client/common/stores/authStore";
import { toast } from "sonner";

const API_BASE_URL = window.urlConfig?.DATA_LINEAGE_API;

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

export const useDownloadS2tReport = () => {
	const { accessToken } = useAuthStore();

	return useCallback(
		async (params: { entityId: string; fallbackFileName: string }) => {
			try {
				const url = new URL(`${API_BASE_URL}/api/s2t-export/dl`);
				url.searchParams.set("entityId", params.entityId);

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
					fileName: responseFileName ?? params.fallbackFileName,
				});
			} catch (e: any) {
				toast.error(`Не удалось скачать отчёт: ${e?.message ?? "ошибка"}`);
				throw e;
			}
		},
		[accessToken],
	);
};
