import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import AdvancedFilterForm from "@react-client/examples/AdvancedFilterForm";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { DataLinageGraph2 } from "@react-client/features/playground/DataLinageGraph2";

const data: any = [
	{
		name: "DataLinageGraph2",
		Component: () => (
			<div style={{ height: "80vh" }}>
				<DataLinageGraph2 />
			</div>
		),
	},
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
				<div />
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
