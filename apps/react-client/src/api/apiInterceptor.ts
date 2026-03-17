import axios, {
	type AxiosResponse,
	type AxiosError,
	type AxiosInstance,
} from "axios";
import { toast } from "sonner";
import { useNotificationStore } from "../common/stores/notificationStore";
import { useAuthStore } from "../common/stores/authStore";
import { jsonDataApi } from "./hooks/jsonDataApi";
import { jsonCommitApi } from "./hooks/jsonCommitApi";
import { jsonDataListApi } from "@react-client/api/hooks/jsonDataListApi";
import { processesApi } from "@react-client/api/hooks/processesApi";
import { s2tCommitStoreApi } from "@react-client/api/hooks/s2tCommitStoreApi";
import { changelogApiInstance } from "@react-client/api/hooks/changelogApi";

const getMethodFromConfig = (config: any): string => {
	return config?.method?.toUpperCase() || "GET";
};

const getUrlFromConfig = (config: any): string => {
	return config?.url || "";
};

const getPathnameFromResponseUrl = (responseUrl?: string): string => {
	if (!responseUrl) {
		return "";
	}

	try {
		const parsedUrl = new URL(responseUrl);
		return `${parsedUrl.pathname}${parsedUrl.search}`;
	} catch {
		return responseUrl;
	}
};

const getUrlFromResponse = (response: AxiosResponse): string => {
	const responseUrl = (response.request as { responseURL?: string } | undefined)
		?.responseURL;
	return getPathnameFromResponseUrl(responseUrl);
};

const getUrlFromError = (error: AxiosError): string => {
	const responseUrl = (
		error.response?.request as { responseURL?: string } | undefined
	)?.responseURL;
	return getPathnameFromResponseUrl(responseUrl);
};

const getOperationLabel = (method: string): string => {
	return method === "GET"
		? "загружены"
		: method === "POST"
			? "созданы"
			: method === "PUT" || method === "PATCH"
				? "обновлены"
				: method === "DELETE"
					? "удалены"
					: "обработаны";
};

const getReadableEndpointName = (url: string): string | null => {
	const normalizedUrl = url.split("?")[0];
	const parts = normalizedUrl
		.split("/")
		.map((part) => part.trim())
		.filter(Boolean)
		.filter((part) => part !== "api")
		.filter((part) => !/^\d+$/.test(part))
		.filter((part) => !/^v\d+$/i.test(part))
		.filter(
			(part) =>
				!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
					part,
				),
		);

	const candidate = parts.at(-1);
	if (!candidate) {
		return null;
	}

	const normalizedName = candidate
		.replace(/[-_]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	if (!normalizedName) {
		return null;
	}

	return normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
};

const shouldShowToast = (url: string): boolean => {
	return !url.includes("/health") && !url.includes("/ping");
};

const getSuccessMessage = (method: string, url: string): string => {
	const IS_DEV = process.env.NODE_ENV === "development";
	const debugMessage = IS_DEV ? ` ${url}, ${method}` : "";
	const operation = getOperationLabel(method);

	if (url.includes("validate")) return "Валидация выполнена";
	if (url.includes("/s2t-import/convert-xlsx-to-commit-json"))
		return "Конвертация выполнена" + debugMessage;
	if (
		method === "POST" &&
		url.includes("/s2t-import/commits") &&
		url.includes("apply")
	)
		return "Коммит применён" + debugMessage;
	if (method === "POST" && url.includes("/s2t-import/commits"))
		return "Коммит сохранён" + debugMessage;

	if (url.includes("/json-data"))
		return `Данные успешно ${operation} ${debugMessage}`;
	if (url.includes("/json-commits"))
		return `Коммиты успешно ${operation} ${debugMessage}`;
	if (url.includes("/debug"))
		return `Отладочная информация ${operation} ${debugMessage}`;

	const endpointName = getReadableEndpointName(url);
	if (endpointName) {
		return `${endpointName} успешно ${operation}${debugMessage}`;
	}

	return `Запрос успешно обработан${debugMessage}`;
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
			const url =
				getUrlFromResponse(response) || getUrlFromConfig(response.config);
			console.log(
				"🐸 Pepe said >> setupInterceptorsForInstance >> response:",
				response,
			);

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
			const url = getUrlFromError(error) || getUrlFromConfig(error.config);
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
	setupInterceptorsForInstance(jsonDataListApi);
	setupInterceptorsForInstance(jsonCommitApi);
	setupInterceptorsForInstance(processesApi);
	setupInterceptorsForInstance(s2tCommitStoreApi);
	setupInterceptorsForInstance(changelogApiInstance);

	// Also setup for global axios instance for any other API calls
	setupInterceptorsForInstance(axios);

	interceptorsSetup = true;
};
