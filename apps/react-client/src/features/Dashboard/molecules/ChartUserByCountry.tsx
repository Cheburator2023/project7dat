import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { PieChart } from "@mui/x-charts/PieChart";
import { useDrawingArea } from "@mui/x-charts/hooks";
import * as React from "react";

const data = [
	{ label: "India", value: 50000 },
	{ label: "USA", value: 35000 },
	{ label: "Brazil", value: 10000 },
	{ label: "Other", value: 5000 },
];

interface StyledTextProps {
	variant: "primary" | "secondary";
}

const StyledText = styled("text", {
	shouldForwardProp: (prop) => prop !== "variant",
})<StyledTextProps>(({ theme }) => ({
	textAnchor: "middle",
	dominantBaseline: "central",
	fill: theme.palette.text.secondary,
	variants: [
		{
			props: {
				variant: "primary",
			},
			style: {
				fontSize: theme.typography.h5.fontSize,
			},
		},
		{
			props: ({ variant }) => variant !== "primary",
			style: {
				fontSize: theme.typography.body2.fontSize,
			},
		},
		{
			props: {
				variant: "primary",
			},
			style: {
				fontWeight: theme.typography.h5.fontWeight,
			},
		},
		{
			props: ({ variant }) => variant !== "primary",
			style: {
				fontWeight: theme.typography.body2.fontWeight,
			},
		},
	],
}));

interface PieCenterLabelProps {
	primaryText: string;
	secondaryText: string;
}

function PieCenterLabel({ primaryText, secondaryText }: PieCenterLabelProps) {
	const { width, height, left, top } = useDrawingArea();
	const primaryY = top + height / 2 - 10;
	const secondaryY = primaryY + 24;

	return (
		<React.Fragment>
			<StyledText variant="primary" x={left + width / 2} y={primaryY}>
				{primaryText}
			</StyledText>
			<StyledText variant="secondary" x={left + width / 2} y={secondaryY}>
				{secondaryText}
			</StyledText>
		</React.Fragment>
	);
}

const colors = [
	"hsl(220, 20%, 65%)",
	"hsl(220, 20%, 42%)",
	"hsl(220, 20%, 35%)",
	"hsl(220, 20%, 25%)",
];

export function ChartUserByCountry() {
	return (
		<Card
			variant="outlined"
			sx={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}
		>
			<CardContent>
				<Typography component="h2" variant="subtitle2">
					Users by country
				</Typography>
				<Box sx={{ display: "flex", alignItems: "center" }}>
					<PieChart
						colors={colors}
						margin={{
							left: 80,
							right: 80,
							top: 80,
							bottom: 80,
						}}
						series={[
							{
								data,
								innerRadius: 75,
								outerRadius: 100,
								paddingAngle: 0,
								highlightScope: { faded: "global", highlighted: "item" },
							},
						]}
						height={260}
						width={260}
						slotProps={{
							legend: { hidden: true },
						}}
					>
						<PieCenterLabel primaryText="98.5K" secondaryText="Total" />
					</PieChart>
				</Box>
			</CardContent>
		</Card>
	);
}
