import SearchInput from "@react-client/features/json4u/components/ui/search/SearchInput";
import {
	type Command,
	useEditorStore,
} from "@react-client/features/json4u/stores/editorStore";
import { useTranslations } from "@react-client/features/json4u/useTranslations";
import fuzzysort from "fuzzysort";
import { useShallow } from "zustand/react/shallow";

export default function CommandSearch() {
	const t = useTranslations();
	const { commands, runCommand } = useEditorStore(
		useShallow((state) => ({
			commands: state.commands,
			runCommand: state.runCommand,
		})),
	);
	const displayCommands = commands.filter((c) => !c.hidden);

	const search = (input: string) =>
		input.trim()
			? fuzzysort
					.go(input, displayCommands, {
						keys: [(cmd) => cmd.id, (cmd) => t(cmd.id)],
					})
					.map((r) => r.obj)
			: displayCommands;

	return (
		<SearchInput
			id="cmd-search"
			bindShortcut="K"
			displayShortcut
			openListOnFocus
			placeholder={"Search Command"}
			search={search}
			onSelect={(cmd) => runCommand(cmd.id)}
			itemHeight={32}
			Item={Item}
		/>
	);
}

function Item({ id, Icon }: Command) {
	const t = useTranslations();
	return (
		<div className="w-full h-8 flex items-center">
			{Icon && <Icon className="icon mr-2" />}
			{t(id as any)}
		</div>
	);
}
