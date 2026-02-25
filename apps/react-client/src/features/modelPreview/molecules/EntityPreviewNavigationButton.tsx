import { Button } from "@mui/material";
import { Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useDataLineageStore } from "@react-client/common/stores/dataLineageStore";

export const EntityPreviewNavigationButton = () => {
	const navigate = useNavigate();
	const { selectedNodes, currentGraph } = useDataLineageStore();

	const selectedEntity =
		selectedNodes.length === 1 && currentGraph?.entities
			? currentGraph.entities.find((entity) => entity.id === selectedNodes[0])
			: null;

	if (!selectedEntity) {
		return null;
	}

	const handleClick = () => {
		const encodedEntityId = encodeURIComponent(selectedEntity.id);
		navigate(`/entity/${encodedEntityId}`);
	};

	return (
		<Button
			variant="outlined"
			startIcon={<Visibility />}
			onClick={handleClick}
			size="small"
		>
			Просмотр сущности
		</Button>
	);
};
