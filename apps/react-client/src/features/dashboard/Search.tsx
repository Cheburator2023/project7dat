import SearchIcon from "@mui/icons-material/Search";
import { Autocomplete, InputAdornment, TextField } from "@mui/material";
import { genValueAttrs } from "@react-client/features/json4u/lib/graph/layout";
import { toPath } from "@react-client/features/json4u/lib/idgen";
import { hasChildren } from "@react-client/features/json4u/lib/parser";
import { cn } from "@react-client/features/json4u/lib/utils";
import { useStatusStore } from "@react-client/features/json4u/stores/statusStore";
import { getTree } from "@react-client/features/json4u/stores/treeStore";
import { useState } from "react";

export function Search() {
	const [_initialed, _setInitialed] = useState(false);
	const [_open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [items, setItems] = useState<any[]>([]);

	const setRevealPosition = useStatusStore((state) => state.setRevealPosition);

	const searchHandler = (value: string) => {
		return window.worker?.searchInView(value);
	};

	const onSearch = (val: string) => {
		(async () => {
			const items = (await Promise.resolve(searchHandler(val))) ?? [];
			setItems(items);
			setOpen(true);
		})();
	};

	const [value, setValue] = useState<string | null>(items[0]);

	return (
		<Autocomplete
			value={value}
			onChange={(_event: any, newValue: string | null) => {
				setValue(newValue);
			}}
			inputValue={inputValue}
			onInputChange={(_event, newInputValue) => {
				onSearch(newInputValue);
				setInputValue(newInputValue);
			}}
			fullWidth
			options={items}
			renderOption={(_props, option) => {
				return (
					<Item
						key={option.id}
						{...option}
						onClick={() =>
							setRevealPosition({
								treeNodeId: option.id,
								type: option.revealType,
								from: "search",
							})
						}
					/>
				);
			}}
			sx={{ width: 300 }}
			renderInput={(params) => (
				<TextField
					{...params}
					variant="outlined"
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
						},
					}}
				/>
			)}
		/>
	);
}

function Item(props: any) {
	const { revealType, id, label } = props;
	const node = getTree().node(id);

	if (!node) {
		return null;
	}

	const _pathStr = ["$", ...toPath(id)].join(" > ");
	let className = "";

	if (revealType === "value") {
		const { className: cls } = genValueAttrs(node);
		className = cls;
	} else if (!hasChildren(node)) {
		className = "text-hl-key";
	}

	return (
		<div
			className="w-full h-12 flex flex-col justify-center"
			onClick={props.onClick}
		>
			<div className={cn("text-sm truncate", className)}>{label}</div>
		</div>
	);
}
