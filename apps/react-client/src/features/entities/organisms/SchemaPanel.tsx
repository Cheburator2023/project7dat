import { memo } from "react";
import { Alert, Box, Typography } from "@mui/material";
import { CodeJsonEditor } from "@react-client/features/codeEditor/CodeJsonEditor";
import { useCurrentDataLineageSnapshot } from "@react-client/api/hooks/useCurrentDataLineageSnapshot";

import { LoadingSpinner } from "../atoms/LoadingSpinner";

export const SchemaPanel = memo(() => {
	const {
		data: currentGraph,
		isLoading,
		isFetching,
		error,
	} = useCurrentDataLineageSnapshot({ enabled: true });

	if (isLoading || isFetching) {
		return <LoadingSpinner size={24} />;
	}

	if (error) {
		return (
			<Box sx={{ p: 2 }}>
				<Alert severity="error">
					Не удалось загрузить полный граф из /dl: {error.message}
				</Alert>
			</Box>
		);
	}

	if (!currentGraph) {
		return (
			<Box
				sx={{
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					p: 2,
				}}
			>
				<Typography color="text.secondary">Полный граф недоступен</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ height: "100%", width: "100%" }}>
			<CodeJsonEditor
				initialData={currentGraph}
				editable={false}
				syncWithDataLineageStore={false}
				dataKey={currentGraph.desc?.change_date ?? "schema-panel-current-graph"}
			/>
		</Box>
	);
});

SchemaPanel.displayName = "SchemaPanel";
