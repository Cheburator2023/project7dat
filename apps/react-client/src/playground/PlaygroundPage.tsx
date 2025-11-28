import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { DashboardPage } from "@react-client/features/dashboard/DashboardPage";

const _data: any = [
	{
		name: "Dashboard2",
		Component: () => (
			<div style={{ zoom: 0.8 }}>
				<DashboardPage />
			</div>
		),
	},
];

export const PlaygroundPage = () => {
	return (
		<div>
			<Header />
			<Flex flexDirection="column" gap={8}>
				{_data?.map((item: any) => (
					<Card key={item.name}>
						<item.Component />
					</Card>
				))}
			</Flex>
		</div>
	);
};
