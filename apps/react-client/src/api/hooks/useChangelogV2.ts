import { useState, useCallback } from "react";
import {
	changelogV2Api,
	type ChangelogResponseV2,
	type GetChangelogV2Params,
} from "../changelogV2Api";

export const useChangelogV2 = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const getChangelog = useCallback(
		async (
			params: GetChangelogV2Params = {},
		): Promise<ChangelogResponseV2 | null> => {
			setLoading(true);
			setError(null);

			try {
				const response = await changelogV2Api.getChangelog(params);
				return response;
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Ошибка при загрузке changelog (v2)";
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
			params: Omit<GetChangelogV2Params, "graphId"> = {},
		): Promise<ChangelogResponseV2 | null> => {
			setLoading(true);
			setError(null);

			try {
				const response = await changelogV2Api.getChangelogForGraph(
					graphId,
					params,
				);
				return response;
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Ошибка при загрузке changelog графика (v2)";
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
