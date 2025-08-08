import { Box } from "@mui/material";
import { Header } from "@react-client/features/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";

export const SwaggerPage = () => {
	return (
		<Box>
			<Header />

			<Flex width="100%">
				<iframe
					src="http://localhost:3000/api/docs"
					width="100%"
					style={{
						border: "none",
						borderRadius: 8,
						minHeight: "600px",
						height: "calc(100vh - 100px)",
					}}
					title="Swagger API Documentation"
				/>
			</Flex>
		</Box>
	);
};
