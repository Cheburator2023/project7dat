import axios, {
	type AxiosResponse,
	type AxiosError,
	type AxiosInstance,
} from "axios";
import { toast } from "sonner";
import { useNotificationStore } from "../stores/notificationStore";
import { useAuthStore } from "../common/store/authStore";
import { jsonDataApi, jsonCommitApi } from "./jsonDataApi";

interface ApiCallInfo {
	method: string;
	url: string;
	status?: number;
	errorMessage?: string;
}

const getMethodFromConfig = (config: any): string => {
	return config?.method?.toUpperCase() || "GET";
};

const getUrlFromConfig = (config: any): string => {
	return config?.url || "Unknown URL";
};

const shouldShowToast = (url: string): boolean => {
	return !url.includes("/health") && !url.includes("/ping");
};

const getSuccessMessage = (method: string, url: string): string => {
	const operation =
		method === "GET"
			? "загружены"
			: method === "POST"
				? "созданы"
				: method === "PUT"
					? "обновлены"
					: method === "DELETE"
						? "удалены"
						: "обработаны";

	if (url.includes("/json-data")) return `Данные успешно ${operation}`;
	if (url.includes("/json-commits")) return `Коммиты успешно ${operation}`;
	if (url.includes("/debug")) return `Отладочная информация ${operation}`;

	return `Операция выполнена успешно`;
};

const getErrorMessage = (
	method: string,
	url: string,
	status?: number,
): string => {
	const operation =
		method === "GET"
			? "загрузке"
			: method === "POST"
				? "создании"
				: method === "PUT"
					? "обновлении"
					: method === "DELETE"
						? "удалении"
						: "обработке";

	let baseMessage = "";
	if (url.includes("/json-data"))
		baseMessage = `Ошибка при ${operation} данных`;
	else if (url.includes("/json-commits"))
		baseMessage = `Ошибка при ${operation} коммитов`;
	else if (url.includes("/debug"))
		baseMessage = `Ошибка при ${operation} отладочной информации`;
	else baseMessage = `Ошибка при ${operation}`;

	if (status) {
		baseMessage += ` (${status})`;
	}

	return baseMessage;
};

const setupInterceptorsForInstance = (instance: AxiosInstance) => {
	// Request interceptor to add auth token
	instance.interceptors.request.use(
		(config) => {
			const authStore = useAuthStore.getState();
			if (authStore.accessToken) {
				config.headers.Authorization = `Bearer ${authStore.accessToken}`;
			}
			// Add user info to headers for commit tracking
			if (authStore.userInfo) {
				config.headers["X-User-Id"] = authStore.userInfo.id;
				config.headers["X-User-Name"] = authStore.userInfo.username;
				config.headers["X-User-Email"] = authStore.userInfo.email;
			}
			return config;
		},
		(error) => {
			return Promise.reject(error);
		},
	);

	// Response interceptor
	instance.interceptors.response.use(
		(response: AxiosResponse) => {
			const method = getMethodFromConfig(response.config);
			const url = getUrlFromConfig(response.config);

			if (shouldShowToast(url)) {
				const message = getSuccessMessage(method, url);

				// Only show toast for non-GET success operations
				if (method !== "GET") {
					toast.success(message);
				}

				// Always add to notification store
				useNotificationStore.getState().addNotification({
					type: "success",
					message,
					method,
					url,
				});
			}

			return response;
		},
		(error: AxiosError) => {
			const method = getMethodFromConfig(error.config);
			const url = getUrlFromConfig(error.config);
			const status = error.response?.status;

			// Handle authentication errors
			if (status === 401 || status === 403) {
				const authStore = useAuthStore.getState();
				if (authStore.isAuthenticated) {
					toast.error("Session expired. Please login again.");
					authStore.logout();
				}
			}

			if (shouldShowToast(url)) {
				const message = getErrorMessage(method, url, status);
				toast.error(message);

				useNotificationStore.getState().addNotification({
					type: "error",
					message,
					method,
					url,
				});
			}

			return Promise.reject(error);
		},
	);
};

let interceptorsSetup = false;

export const setupApiInterceptors = () => {
	if (interceptorsSetup) {
		return;
	}

	// Setup interceptors for specific axios instances
	setupInterceptorsForInstance(jsonDataApi);
	setupInterceptorsForInstance(jsonCommitApi);

	// Also setup for global axios instance for any other API calls
	setupInterceptorsForInstance(axios);

	interceptorsSetup = true;
};
