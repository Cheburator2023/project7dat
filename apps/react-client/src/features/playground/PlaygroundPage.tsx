import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";
import { JsondiffpatchReact } from "@react-client/common/jsondiffpatchReact/JsondiffpatchReact";
import { Header } from "@react-client/features/navigation/organisms/Header";

const data: any = [
	{
		name: "JsondiffpatchReact",
		Component: () => (
			<JsondiffpatchReact
				left={{ a: 1 }}
				right={{ a: 2 }}
				objectHash={(obj: any) => obj.a}
			/>
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
