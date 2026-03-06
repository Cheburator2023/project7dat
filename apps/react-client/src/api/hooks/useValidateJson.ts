import { useMutation } from "@tanstack/react-query";
import { default as axios } from "axios";

const API_BASE_URL = window.urlConfig?.DATA_LINEAGE_API;

interface ValidateJsonRequest {
	data: Record<string, unknown>;
}

interface ValidateJsonResponse {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	validation?: {
		isValid: boolean;
		errors: string[];
		warnings: string[];
	};
}

export const useValidateJson = () => {
	return useMutation<ValidateJsonResponse, Error, ValidateJsonRequest>({
		mutationFn: async (payload) => {
			const response = await axios.post(
				`${API_BASE_URL}/api/json-validation/validate`,
				payload,
			);
			return response.data;
		},
	});
};
