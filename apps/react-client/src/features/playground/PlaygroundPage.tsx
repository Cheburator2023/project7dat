import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { DataMartLineageUI } from "@react-client/features/playground/DataMartExample";

const data = [{ name: "DataMartLineageUI", Component: DataMartLineageUI }];

export const PlaygroundPage = () => {
	return (
		<div>
			<Header />
			<Flex flexDirection="column" gap={8}>
				{data.map((item) => (
					<Card key={item.name}>
						<item.Component />
					</Card>
				))}
			</Flex>
		</div>
	);
};
