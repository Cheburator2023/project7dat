import { useCallback } from "react";

const downloadJson = (params: { data: unknown; fileName: string }) => {
	const dataStr = JSON.stringify(params.data, null, 2);
	const dataBlob = new Blob([dataStr], { type: "application/json" });
	const url = URL.createObjectURL(dataBlob);

	const link = document.createElement("a");
	link.href = url;
	link.download = params.fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

export const useDownloadJsonReport = () => {
	return useCallback((params: { data: unknown; fileName: string }) => {
		downloadJson(params);
	}, []);
};
