import { ControlButton } from "@xyflow/react";
import { Mouse, Touchpad } from "lucide-react";
import { useEffect, useState } from "react";

const detectOS = (): string => {
	if (typeof window === "undefined") return "Unknown";
	const userAgent = window.navigator.userAgent;
	if (userAgent.includes("Mac")) return "Mac";
	if (userAgent.includes("Win")) return "Windows";
	if (userAgent.includes("Linux")) return "Linux";
	return "Unknown";
};

export function MouseButton() {
	const [isTouchpad, setIsTouchpad] = useState<boolean>(false);

	useEffect(() => {
		setIsTouchpad(detectOS() === "Mac");
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
