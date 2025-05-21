import { ViewMode } from "@react-client/features/json4u/lib/db/config";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { useTreeVersion } from "@react-client/features/json4u/stores/treeStore";
import { useUserStore } from "@react-client/features/json4u/stores/userStore";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export function useTableHTML() {
	const { count, usable } = useUserStore(
		useShallow((state) => ({
			count: state.count,
			usable: state.usable("tableModeView"),
		})),
	);
	const { isTableView, setShowPricingOverlay } = useStatusStore(
		useShallow((state) => ({
			isTableView: state.viewMode === ViewMode.Table,
			setShowPricingOverlay: state.setShowPricingOverlay,
		})),
	);
	const treeVersion = useTreeVersion();
	const [innerHTML, setInnerHTML] = useState("");

	useEffect(() => {
		if (!(window.worker && isTableView)) {
			console.log("skip table render:", isTableView, treeVersion);
			return;
		}

		if (!usable) {
			console.log("skip table render because reach out of free quota.");
			setShowPricingOverlay(true);
			return;
		}

		(async () => {
			const tableHTML = await window.worker.createTable();
			setInnerHTML(tableHTML);
			console.log(
				"create a new table:",
				treeVersion,
				tableHTML.length,
				tableHTML.slice(0, 100),
			);
			tableHTML.length > 0 && count("tableModeView");
		})();
	}, [usable, isTableView, treeVersion]);

	return innerHTML ? { __html: innerHTML } : undefined;
}
