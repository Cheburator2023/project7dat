import Editor from "@monaco-editor/react";
import { useColorScheme } from "@mui/material";
import { Card } from "@nextui-org/card";
import { memo } from "react";
import { formatJsonLikeData } from "../../../utils/json.util";

type Props = {
	array: any[];
};

const _ArrayInspector = ({ array }: Props) => {
	const { mode, systemMode, setMode } = useColorScheme();

	return (
		<Card className="h-[160px]" shadow="sm">
			<Editor
				theme={mode === "dark" ? "vs-dark" : "light"}
				defaultLanguage="json"
				options={{
					minimap: {
						enabled: false,
					},
					scrollbar: {
						horizontal: "hidden",
					},
					overviewRulerLanes: 0,
					readOnly: true,
				}}
				defaultValue={formatJsonLikeData(array)}
			/>
		</Card>
	);
};

export const ArrayInspector = memo(_ArrayInspector);
