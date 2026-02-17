import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export const DEPTH_LIMIT_MAX = 100;

export interface UseGraphDepthControlParams {
	/** Maximum traversal depth computed from the full graph (frontend BFS) */
	maxDepth?: number;
	initialDepth?: number;
	externalDepthLimit?: number;
	onDepthChange?: (depth: number) => void;
}

export interface UseGraphDepthControlReturn {
	depthLimit: number;
	setDepthLimit: React.Dispatch<React.SetStateAction<number>>;
	canIncrease: boolean;
	canDecrease: boolean;
	handleIncreaseDepth: () => void;
	handleDecreaseDepth: () => void;
	handleGhostClick: () => void;
	isDepthPanelOpen: boolean;
	setIsDepthPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useGraphDepthControl = ({
	maxDepth = DEPTH_LIMIT_MAX,
	initialDepth = 1,
	externalDepthLimit,
	onDepthChange,
}: UseGraphDepthControlParams): UseGraphDepthControlReturn => {
	const [depthLimit, setDepthLimit] = useState(
		externalDepthLimit ?? initialDepth,
	);
	const [isDepthPanelOpen, setIsDepthPanelOpen] = useState(true);

	const effectiveMax = Math.min(Math.max(1, maxDepth), DEPTH_LIMIT_MAX);

	useEffect(() => {
		if (externalDepthLimit == null) return;
		setDepthLimit(externalDepthLimit);
	}, [externalDepthLimit]);

	useEffect(() => {
		if (depthLimit > DEPTH_LIMIT_MAX) {
			setDepthLimit(DEPTH_LIMIT_MAX);
		}
		if (depthLimit < 1) {
			setDepthLimit(1);
		}
	}, [depthLimit]);

	useEffect(() => {
		if (depthLimit <= effectiveMax) return;
		setDepthLimit(effectiveMax);
		onDepthChange?.(effectiveMax);
	}, [depthLimit, effectiveMax, onDepthChange]);
	const canIncrease = depthLimit < effectiveMax;
	const canDecrease = depthLimit > 1;

	const handleIncreaseDepth = useCallback(() => {
		setDepthLimit((prev) => {
			if (prev >= effectiveMax) {
				toast.info("Максимальная глубина достигнута");
				return prev;
			}
			const newDepth = prev + 1;
			onDepthChange?.(newDepth);
			return newDepth;
		});
	}, [effectiveMax, onDepthChange]);

	const handleDecreaseDepth = useCallback(() => {
		setDepthLimit((prev) => {
			const newDepth = Math.max(1, prev - 1);
			onDepthChange?.(newDepth);
			return newDepth;
		});
	}, [onDepthChange]);

	const handleGhostClick = useCallback(() => {
		handleIncreaseDepth();
	}, [handleIncreaseDepth]);

	return {
		depthLimit,
		setDepthLimit,
		canIncrease,
		canDecrease,
		handleIncreaseDepth,
		handleDecreaseDepth,
		handleGhostClick,
		isDepthPanelOpen,
		setIsDepthPanelOpen,
	};
};
