import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { Header } from "@react-client/features/navigation/organisms/Header";

const data: any = [];

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
