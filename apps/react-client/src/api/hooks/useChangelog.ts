import { useState, useCallback } from "react";
import {
	changelogApi,
	type ChangelogResponse,
	type GetChangelogParams,
} from "./changelogApi";

export const useChangelog = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const getChangelog = useCallback(
		async (
			params: GetChangelogParams = {},
		): Promise<ChangelogResponse | null> => {
			setLoading(true);
			setError(null);

			try {
				const response = await changelogApi.getChangelog(params);
				return response;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Ошибка при загрузке changelog";
				setError(errorMessage);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const getChangelogForGraph = useCallback(
		async (
			graphId: string,
			params: Omit<GetChangelogParams, "graphId"> = {},
		): Promise<ChangelogResponse | null> => {
			setLoading(true);
			setError(null);

			try {
				const response = await changelogApi.getChangelogForGraph(
					graphId,
					params,
				);
				return response;
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Ошибка при загрузке changelog графика";
				setError(errorMessage);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return {
		loading,
		error,
		getChangelog,
		getChangelogForGraph,
	};
};
