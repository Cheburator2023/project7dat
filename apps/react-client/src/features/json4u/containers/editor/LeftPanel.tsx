import {
	Container,
	ContainerContent,
	ContainerHeader,
} from "@react-client/features/json4u/components/Container";
import CommandSearchInput from "@react-client/features/json4u/components/ui/search/CommandSearchInput";
import Editor from "@react-client/features/json4u/containers/editor/editor";

export default function LeftPanel() {
	return (
		<Container>
			<ContainerHeader>
				<CommandSearchInput />
			</ContainerHeader>
			<ContainerContent>
				<Editor kind="main" />
			</ContainerContent>
		</Container>
	);
}
