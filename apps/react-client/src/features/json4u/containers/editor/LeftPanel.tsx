import {
	Container,
	ContainerContent,
	ContainerHeader,
} from "@react-client/features/json4u/components/Container";
import { CommandSearch } from "@react-client/features/json4u/components/ui/search/CommandSearchInput";
import { Editor } from "@react-client/features/json4u/containers/editor/editor/Editor";

export function LeftPanel() {
	return (
		<Container>
			<ContainerHeader>
				<CommandSearch />
			</ContainerHeader>
			<ContainerContent>
				<Editor kind="main" />
			</ContainerContent>
		</Container>
	);
}
