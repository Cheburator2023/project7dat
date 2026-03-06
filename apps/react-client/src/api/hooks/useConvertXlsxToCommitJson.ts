import { useMutation } from "@tanstack/react-query";
import { default as axios } from "axios";

const API_BASE_URL = window.urlConfig?.DATA_LINEAGE_API;

interface ConvertXlsxRequest {
	xlsxBase64: string;
	fileName: string;
	commitName: string;
	processName?: string;
	processDescription?: string;
}

interface ConvertXlsxResponse {
	commitJson: Record<string, unknown>;
	meta: {
		fileName?: string;
		generatedAt: string;
	};
}

export const useConvertXlsxToCommitJson = () => {
	return useMutation<ConvertXlsxResponse, Error, ConvertXlsxRequest>({
		mutationFn: async (data) => {
			const response = await axios.post(
				`${API_BASE_URL}/api/s2t-import/convert-xlsx-to-commit-json`,
				data,
			);
			return response.data;
		},
	});
};
