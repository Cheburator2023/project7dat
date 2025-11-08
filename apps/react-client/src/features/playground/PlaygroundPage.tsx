import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import AdvancedFilterForm from "@react-client/examples/AdvancedFilterForm";
import { Header } from "@react-client/features/navigation/organisms/Header";
import SQLiteViewer from "@react-client/features/playground/SQLViewer";

const data: any = [
	{
		name: "AdvancedFilterForm",
		Component: () => (
			<div style={{ zoom: 0.8 }}>
				<AdvancedFilterForm />
			</div>
		),
	},
	{
		name: "SQLViewer",
		Component: () => (
			<div style={{ zoom: 0.8 }}>
				<SQLiteViewer />
			</div>
		),
	},
];

export const PlaygroundPage = () => {
	return (
		<div>
			<Header />
			<Flex flexDirection="column" gap={8}>
				{data?.map((item: any) => (
					<Card key={item.name}>
						<item.Component />
					</Card>
				))}
			</Flex>
		</div>
	);
};
