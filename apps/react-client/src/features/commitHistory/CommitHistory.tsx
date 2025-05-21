import { Avatar, Typography } from "@mui/material";
import { Card } from "@react-client/common/muiCustom/Card";
import { Flex } from "@react-client/common/primitives/Flex";

const fakeData = Array(9)
	.fill(1)
	.map((e, i) => e + i * 1);

export const CommitHistory = () => {
	return (
		<Flex gap={10} flexDirection="column">
			{fakeData.map((card, idx) => {
				return (
					<Card key={idx}>
						<Flex gap={8}>
							<Avatar />
							<Flex flexDirection="column">
								<Typography>
									<b>Lorem ipsum dolor sit amet consectetur adipisicing elit</b>
								</Typography>
								<Typography>{crypto.randomUUID()}</Typography>
								<Typography>{new Date().toDateString()}</Typography>
							</Flex>
						</Flex>
					</Card>
				);
			})}
		</Flex>
	);
};
