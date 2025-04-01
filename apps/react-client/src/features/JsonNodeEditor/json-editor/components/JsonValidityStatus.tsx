import { Typography } from "@mui/material";

import { Flex } from "../../../../common/primitives/Flex";
import { useJsonEngineStore } from "../../store/json-engine/json-engine.store";

export const JsonValidityStatus = () => {
	const isValidJson = useJsonEngineStore((state) => state.isValidJson);

	return (
		<Flex position="absolute" right={0} top={0} style={{ zIndex: 20 }}>
			<Typography>{isValidJson ? "Верный JSON" : "Неверный JSON"}</Typography>
		</Flex>
	);
};
