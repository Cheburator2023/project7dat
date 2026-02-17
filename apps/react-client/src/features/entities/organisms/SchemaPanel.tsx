import { memo, useMemo } from "react";
import { Box } from "@mui/material";

import { useCurrentSchema } from "../hooks/useCurrentSchema";
import { inferJsonSchema, formatSchema } from "../utils";

export const SchemaPanel = memo(() => {
	// Use currentSchema hook to get data synced with editor
	const { currentSchema } = useCurrentSchema();

	const schema = useMemo(() => {
		if (!currentSchema) return { type: "null" as const };
		return inferJsonSchema(currentSchema, 6);
	}, [currentSchema]);

	return (
		<Box sx={{ p: 2, height: "100%", overflow: "auto", fontSize: 12 }}>
			<Box
				component="pre"
				sx={{
					p: 1.5,
					bgcolor: "grey.50",
					borderRadius: 1,
					fontSize: 10,
					fontFamily: "monospace",
					overflow: "auto",
					border: "1px solid",
					borderColor: "divider",
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
				}}
			>
				{`{\n${formatSchema(schema, 1)}\n}`}
			</Box>
		</Box>
	);
});

SchemaPanel.displayName = "SchemaPanel";
