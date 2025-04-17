import { detectOS } from "@react-client/features/json4u/lib/utils";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { ControlButton } from "@xyflow/react";
import { Mouse, Touchpad } from "lucide-react";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

export default function MouseButton() {
	const { isTouchpad, setIsTouchpad } = useStatusStore(
		useShallow((state) => ({
			isTouchpad: state.isTouchpad,
			setIsTouchpad: state.setIsTouchpad,
		})),
	);

	useEffect(() => {
		if (isTouchpad === undefined) {
			setIsTouchpad(detectOS() === "Mac");
		}
	}, []);

	return (
		<ControlButton
			title="switch between mouse and touchpad mode"
			onClick={() => setIsTouchpad(!isTouchpad)}
		>
			{isTouchpad ? (
				<Touchpad style={{ fill: "none" }} />
			) : (
				<Mouse style={{ fill: "none" }} />
			)}
		</ControlButton>
	);
}
