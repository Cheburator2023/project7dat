import { memo } from "react";
import { Panel } from "@xyflow/react";
import { AccountTree } from "@mui/icons-material";

export interface DepthControlPanelProps {
	depthLimit: number;
	canIncrease: boolean;
	canDecrease: boolean;
	isDepthPanelOpen: boolean;
	onIncrease: () => void;
	onDecrease: () => void;
}

export const DepthControlPanel = memo<DepthControlPanelProps>(
	({
		depthLimit,
		canIncrease,
		canDecrease,
		isDepthPanelOpen,
		onIncrease,
		onDecrease,
	}) => {
		return (
			<Panel position="bottom-center">
				{isDepthPanelOpen ? (
					<div
						style={{
							background: "#fff",
							padding: "8px 10px",
							borderRadius: 10,
							boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
							minWidth: 240,
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								fontSize: 10,
								color: "#666",
								gap: 8,
							}}
						>
							<button
								onClick={onDecrease}
								type="button"
								disabled={!canDecrease}
								style={{
									width: 26,
									height: 26,
									borderRadius: 6,
									border: "1px solid #ddd",
									background: "#fff",
									cursor: !canDecrease ? "not-allowed" : "pointer",
								}}
								title="Уменьшить глубину"
							>
								-
							</button>
							<span>Глубина: {depthLimit}</span>
							<button
								onClick={onIncrease}
								type="button"
								disabled={!canIncrease}
								style={{
									width: 26,
									height: 26,
									borderRadius: 6,
									border: "1px solid #ddd",
									background: "#fff",
									cursor: !canIncrease ? "not-allowed" : "pointer",
								}}
								title="Увеличить глубину"
							>
								+
							</button>
						</div>
					</div>
				) : null}
			</Panel>
		);
	},
);

DepthControlPanel.displayName = "DepthControlPanel";

export interface DepthControlToggleButtonProps {
	onToggle: () => void;
	disabled?: boolean;
}

export const DepthControlToggleButton = memo<DepthControlToggleButtonProps>(
	({ onToggle, disabled }) => {
		return (
			<div data-name="open_depth_panel">
				<button
					onClick={onToggle}
					style={{
						width: 26,
						height: 26,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "#fff",
						border: "none",
						cursor: disabled ? "not-allowed" : "pointer",
						padding: 0,
					}}
					title="Глубина"
					type="button"
					disabled={disabled}
				>
					<AccountTree style={{ fontSize: 16, color: "#666" }} />
				</button>
			</div>
		);
	},
);

DepthControlToggleButton.displayName = "DepthControlToggleButton";
