import { Typography } from "@mui/material";
import type { StatisticsKeys } from "@react-client/features/json4u/lib/env";
import { dateToYYYYMMDD } from "@react-client/features/json4u/lib/utils";
import {
	freeQuota,
	initialStatistics,
	useUserStore,
} from "@react-client/features/json4u/stores/userStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import { useShallow } from "zustand/react/shallow";

const i18nMap: Record<StatisticsKeys, any> = {
	graphModeView: "stats_graph",
	tableModeView: "stats_table",
	textComparison: "stats_compare",
	jqExecutions: "stats_jq",
};

export function StatisticsPopover() {
	const t = useTranslations();
	const { statistics, setStatistics, nextQuotaRefreshTime, isPremium } =
		useUserStore(
			useShallow((state) => ({
				statistics: state.statistics,
				setStatistics: state.setStatistics,
				nextQuotaRefreshTime: state.nextQuotaRefreshTime,
				isPremium: state.isPremium(),
			})),
		);

	return <div />;
}

async function getPublicIP() {
	try {
		const resp = await fetch("https://api64.ipify.org");
		return await resp.text();
	} catch (error) {
		console.error("failed to get public IP:", error);
	}
}
