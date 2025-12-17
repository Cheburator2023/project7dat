import {
	Dialog,
	DialogTitle,
	DialogContent,
	Box,
	Typography,
	Paper,
	IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useState } from "react";
import { LAYOUT_PRESETS } from "../constants";
import type { LayoutPreset, ModalStep } from "../types";

interface BuilderModalProps {
	open: boolean;
	onClose: () => void;
	onSelectCustom: () => void;
	onSelectPreset: (preset: LayoutPreset) => void;
}

export const BuilderModal = ({
	open,
	onClose,
	onSelectCustom,
	onSelectPreset,
}: BuilderModalProps) => {
	const [step, setStep] = useState<ModalStep>("initial");

	const handleClose = () => {
		setStep("initial");
		onClose();
	};

	const handleBack = () => {
		setStep("initial");
	};

	const handleSelectCustom = () => {
		handleClose();
		onSelectCustom();
	};

	const handleSelectPreset = (preset: LayoutPreset) => {
		handleClose();
		onSelectPreset(preset);
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: { borderRadius: 3 },
			}}
		>
			<DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				{step !== "initial" && (
					<IconButton onClick={handleBack} size="small">
						<ArrowBackIcon />
					</IconButton>
				)}
				<Typography variant="h6" sx={{ flex: 1 }}>
					{step === "initial" && "Создать дашборд"}
					{step === "presets" && "Выберите пресет разметки"}
				</Typography>
				<IconButton onClick={handleClose}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			<DialogContent>
				{step === "initial" && (
					<InitialStep
						onSelectCustom={handleSelectCustom}
						onSelectPresets={() => setStep("presets")}
					/>
				)}
				{step === "presets" && (
					<PresetsStep onSelectPreset={handleSelectPreset} />
				)}
			</DialogContent>
		</Dialog>
	);
};

interface InitialStepProps {
	onSelectCustom: () => void;
	onSelectPresets: () => void;
}

const InitialStep = ({ onSelectCustom, onSelectPresets }: InitialStepProps) => (
	<OptionsContainer>
		<OptionCard onClick={onSelectCustom}>
			<DashboardCustomizeIcon sx={{ fontSize: 48, color: "primary.main" }} />
			<Typography variant="h6" sx={{ mt: 2 }}>
				Создать с нуля
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
				Пустой лейаут с панелью выбора готовых панелей справа. Перетаскивайте
				панели для создания произвольной разметки.
			</Typography>
		</OptionCard>

		<OptionCard onClick={onSelectPresets}>
			<ViewQuiltIcon sx={{ fontSize: 48, color: "secondary.main" }} />
			<Typography variant="h6" sx={{ mt: 2 }}>
				Выбрать пресет
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
				Выберите готовую разметку: 2x2, бок о бок, один таб и другие варианты.
			</Typography>
		</OptionCard>
	</OptionsContainer>
);

interface PresetsStepProps {
	onSelectPreset: (preset: LayoutPreset) => void;
}

const PresetsStep = ({ onSelectPreset }: PresetsStepProps) => (
	<PresetsGrid>
		{LAYOUT_PRESETS.map((preset) => (
			<PresetCard key={preset.id} onClick={() => onSelectPreset(preset)}>
				<PresetIcon>{preset.icon}</PresetIcon>
				<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
					{preset.name}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{preset.description}
				</Typography>
			</PresetCard>
		))}
	</PresetsGrid>
);

const OptionsContainer = styled(Box)(({ theme }) => ({
	display: "grid",
	gridTemplateColumns: "repeat(2, 1fr)",
	gap: theme.spacing(3),
	padding: theme.spacing(2),
}));

const OptionCard = styled(Paper)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	textAlign: "center",
	padding: theme.spacing(4),
	cursor: "pointer",
	border: `2px solid transparent`,
	borderRadius: 16,
	transition: "all 0.2s ease",
	"&:hover": {
		borderColor: theme.palette.primary.main,
		backgroundColor: theme.palette.action.hover,
		transform: "translateY(-4px)",
		boxShadow: theme.shadows[4],
	},
}));

const PresetsGrid = styled(Box)(({ theme }) => ({
	display: "grid",
	gridTemplateColumns: "repeat(3, 1fr)",
	gap: theme.spacing(2),
	padding: theme.spacing(2),
}));

const PresetCard = styled(Paper)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	textAlign: "center",
	padding: theme.spacing(3),
	cursor: "pointer",
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: 16,
	transition: "all 0.2s ease",
	"&:hover": {
		borderColor: theme.palette.primary.main,
		backgroundColor: theme.palette.action.hover,
	},
}));

const PresetIcon = styled("span")({
	fontSize: 36,
	marginBottom: 8,
});
