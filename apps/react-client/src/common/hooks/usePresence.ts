import { useEffect, useState } from "react";

export const usePresence = (options: {
	visible: boolean;
	exitDelayMs?: number;
}) => {
	const { visible, exitDelayMs = 160 } = options;
	const [isMounted, setIsMounted] = useState(visible);

	useEffect(() => {
		if (visible) {
			setIsMounted(true);
			return;
		}

		if (!isMounted) return;

		const handle = window.setTimeout(() => {
			setIsMounted(false);
		}, exitDelayMs);

		return () => window.clearTimeout(handle);
	}, [exitDelayMs, isMounted, visible]);

	return {
		isMounted,
	};
};
