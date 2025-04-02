import CloseIcon from "@mui/icons-material/Close";
import { type ComponentProps, useCallback, useEffect } from "react";

import {
	Button,
	Card,
	IconButton,
	type Input,
	Modal,
	TextField,
	Typography,
} from "@mui/material";
import { Flex } from "../../../../common/primitives/Flex";
import { Spacer } from "../../../../common/primitives/Spacer";
import { useJsonDiagramViewStore } from "../../store/json-diagram-view/json-diagram-view.store";
import { useJsonEngineStore } from "../../store/json-engine/json-engine.store";
import {
	formatJsonLikeData,
	isArray,
	isNull,
	isObject,
	isValidJson,
} from "../../utils/json.util";
import { useSimpleFetch } from "../../utils/react-hooks/useSimpleFetch";
import { useString } from "../../utils/react-hooks/useString";
import { DragDropJsonFile } from "./DragDropJsonFile";

type Props = {
	isModalOpen: boolean;
	closeModal: () => void;
};

export const ImportJsonModal = ({ isModalOpen, closeModal }: Props) => {
	const {
		string: jsonUrlValue,
		isEmpty: isJsonUrlValueEmpty,
		setString: setJsonUrlValue,
		clearString: clearJsonUrlValue,
	} = useString();
	const {
		loading: isGetJsonLoading,
		data: getJsonResponse,
		error: getJsonError,
		fetchUrl: fetchJsonUrl,
		resetError: resetGetJsonError,
	} = useSimpleFetch();

	const setStringifiedJson = useJsonEngineStore(
		(state) => state.setStringifiedJson,
	);
	const resetSelectedNode = useJsonDiagramViewStore(
		(state) => state.resetSelectedNode,
	);

	const handleJsonUrlValueChange: ComponentProps<typeof Input>["onChange"] =
		useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				setJsonUrlValue(e.target.value);
				resetGetJsonError();
			},
			[setJsonUrlValue, resetGetJsonError],
		);

	const handleJsonUrlValueClear = () => {
		clearJsonUrlValue();
		resetGetJsonError();
	};

	const handleJsonUrlInputKeyDown: any = (e: any) => {
		if (e.key === "Enter" && !isJsonUrlValueEmpty) {
			fetchJsonUrl(jsonUrlValue);
		}
	};

	useEffect(() => {
		if (!isModalOpen) {
			resetGetJsonError();
			clearJsonUrlValue();
		}
	}, [isModalOpen, resetGetJsonError, clearJsonUrlValue]);

	useEffect(() => {
		if (isObject(getJsonResponse) || isArray(getJsonResponse)) {
			const formattedData: string = formatJsonLikeData(getJsonResponse);

			if (isValidJson(formattedData)) {
				setStringifiedJson(formattedData);
				resetSelectedNode();
				closeModal();
			}
		}
	}, [getJsonResponse, setStringifiedJson, resetSelectedNode, closeModal]);

	const isInvalid = !isNull(getJsonError);

	return (
		<Modal open={isModalOpen} onClose={closeModal}>
			<Flex
				width="100%"
				height="100%"
				justifyContent="center"
				alignItems="center"
			>
				<Flex width="600px">
					<Card style={{ width: "100%", height: "100%" }} variant="outlined">
						<Flex width="100%" justifyContent="space-between">
							<Typography variant="h5">Импортировать JSON</Typography>
							<IconButton aria-label="close" onClick={closeModal}>
								<CloseIcon />
							</IconButton>
						</Flex>

						<Spacer />

						<div>
							<Flex gap={20}>
								<TextField
									aria-label="Поле ввода URL для JSON"
									size="medium"
									disabled={isGetJsonLoading}
									fullWidth
									helperText={
										isInvalid
											? "Не удалось загрузить JSON по указанному URL"
											: undefined
									}
									error={isInvalid}
									value={jsonUrlValue}
									placeholder="Введите URL JSON для загрузки"
									onChange={handleJsonUrlValueChange}
									onKeyDown={handleJsonUrlInputKeyDown}
								/>
								<Button
									variant="contained"
									color="primary"
									// disabled={isJsonUrlValueEmpty || isGetJsonLoading}
									onClick={() => fetchJsonUrl(jsonUrlValue)}
								>
									Загрузить
								</Button>
							</Flex>

							<Spacer space={20} />

							<DragDropJsonFile afterFileReadSuccess={closeModal} />
						</div>
					</Card>
				</Flex>
			</Flex>
		</Modal>
	);
};
