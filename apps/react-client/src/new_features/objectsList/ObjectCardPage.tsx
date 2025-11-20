import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
	Box,
	Typography,
	Button,
	Chip,
	Divider,
	CircularProgress,
	Alert,
	Card,
	CardContent,
	List,
	ListItem,
	ListItemText,
} from "@mui/material";
import {
	ArrowBack as ArrowBackIcon,
	Info as InfoIcon,
	Storage as StorageIcon,
	AccountTree as AccountTreeIcon,
	Description as DescriptionIcon,
} from "@mui/icons-material";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { Spacer } from "@react-client/common/primitives/Spacer";
import { useJsonDataListV2 } from "@react-client/api/hooks";
import type { JsonDataItem } from "@react-client/api/jsonDataV2Api";

interface ObjectItem {
	id: string;
	graphId?: string;
	object: string;
	objectType: "Модель" | "Витрина" | "Признак";
	description: string;
	modelId: string;
	database: string;
	process: string;
	processDescription: string;
}

const mapJsonDataItemToObjects = (item: JsonDataItem): ObjectItem[] => {
	const { id: graphId, name: jsonName, description, data } = item;

	const appId = data.desc?.appId ?? "";
	const appName = data.desc?.appName ?? "";

	return data?.entities?.flatMap((entity) => {
		const database = entity.namespace ?? appId;
		const process = appName || jsonName;
		const processDescription = description ?? (appName || jsonName);

		const rows: ObjectItem[] = [];

		rows.push({
			id: `${graphId}::${entity.id}`,
			graphId,
			object: entity.name ?? entity.id,
			objectType: entity.type === "view" ? "Витрина" : "Модель",
			description: processDescription,
			modelId: entity.id,
			database,
			process,
			processDescription,
		});

		if (entity.attrSeq) {
			for (const attr of entity.attrSeq) {
				rows.push({
					id: `${graphId}::${entity.id}::${attr.name}`,
					graphId,
					object: attr.name,
					objectType: "Признак",
					description: attr.comment ?? "",
					modelId: entity.id,
					database,
					process,
					processDescription,
				});
			}
		}

		return rows;
	});
};

export const ObjectCardPage: React.FC = () => {
	const { objectId } = useParams<{ objectId: string }>();
	const navigate = useNavigate();
	const { data: jsonDataList, isLoading, error } = useJsonDataListV2();

	const allObjects = useMemo<ObjectItem[]>(() => {
		if (!jsonDataList) {
			return [];
		}
		return jsonDataList.flatMap(mapJsonDataItemToObjects);
	}, [jsonDataList]);

	const currentObject = useMemo(() => {
		if (!objectId) return null;
		const decodedId = decodeURIComponent(objectId);
		return allObjects.find((obj) => obj.id === decodedId);
	}, [allObjects, objectId]);

	const relatedObjects = useMemo(() => {
		if (!currentObject) return [];

		// Если это признак, найти родительскую модель/витрину
		if (currentObject.objectType === "Признак") {
			return allObjects.filter(
				(obj) =>
					obj?.modelId === currentObject?.modelId &&
					obj?.graphId === currentObject?.graphId &&
					obj?.objectType !== "Признак",
			);
		}

		// Если это модель/витрина, найти все признаки
		return allObjects.filter(
			(obj) =>
				obj?.modelId === currentObject?.modelId &&
				obj?.graphId === currentObject?.graphId &&
				obj?.objectType === "Признак",
		);
	}, [currentObject, allObjects]);

	const getTypeColor = (type: string) => {
		switch (type) {
			case "Модель":
				return "primary";
			case "Витрина":
				return "warning";
			case "Признак":
				return "success";
			default:
				return "default";
		}
	};

	if (isLoading) {
		return (
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "50vh",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">Ошибка загрузки объекта: {error.message}</Alert>
			</Box>
		);
	}

	if (!currentObject) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="warning">Объект не найден</Alert>
				<Button
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate("/objects")}
					sx={{ mt: 2 }}
				>
					Вернуться к списку объектов
				</Button>
			</Box>
		);
	}

	return (
		<Box>
			<Header>
				<Flex alignItems="center" gap={10} width="100%">
					<Typography variant="h6" sx={{ flexGrow: 1 }}>
						Карточка объекта: {currentObject.object}
					</Typography>
					<Chip
						label={currentObject.objectType}
						color={getTypeColor(currentObject.objectType) as any}
						size="small"
					/>
				</Flex>
			</Header>

			<Spacer space={6} />

			<Flex flexDirection="column" gap={10}>
				{/* Основная информация */}
				<Box>
					<Card>
						<CardContent>
							<Flex alignItems="center" gap={8} sx={{ mb: 2 }}>
								<InfoIcon color="primary" />
								<Typography variant="h6">Основная информация</Typography>
							</Flex>
							<Divider sx={{ mb: 2 }} />
							<List dense>
								<ListItem>
									<ListItemText
										primary="Название объекта"
										secondary={currentObject.object}
									/>
								</ListItem>
								<ListItem>
									<ListItemText
										primary="Тип объекта"
										secondary={
											<Chip
												label={currentObject.objectType}
												color={getTypeColor(currentObject.objectType) as any}
												size="small"
												sx={{ mt: 0.5 }}
											/>
										}
									/>
								</ListItem>
								<ListItem>
									<ListItemText
										primary="Описание"
										secondary={currentObject.description || "—"}
									/>
								</ListItem>
								<ListItem>
									<ListItemText
										primary="ID объекта"
										secondary={
											<Typography
												variant="body2"
												fontFamily="monospace"
												sx={{ mt: 0.5 }}
											>
												{currentObject.id}
											</Typography>
										}
									/>
								</ListItem>
							</List>
						</CardContent>
					</Card>
				</Box>

				{/* Информация о модели */}
				<Box>
					<Card>
						<CardContent>
							<Flex alignItems="center" gap={8} sx={{ mb: 2 }}>
								<StorageIcon color="primary" />
								<Typography variant="h6">Информация о модели</Typography>
							</Flex>
							<Divider sx={{ mb: 2 }} />
							<List dense>
								<ListItem>
									<ListItemText
										primary="Модель ID"
										secondary={
											<Typography
												variant="body2"
												fontFamily="monospace"
												sx={{ mt: 0.5 }}
											>
												{currentObject.modelId}
											</Typography>
										}
									/>
								</ListItem>
								<ListItem>
									<ListItemText
										primary="База данных"
										secondary={
											<Typography
												variant="body2"
												fontFamily="monospace"
												sx={{ mt: 0.5 }}
											>
												{currentObject.database}
											</Typography>
										}
									/>
								</ListItem>
								<ListItem>
									<ListItemText
										primary="Graph ID"
										secondary={
											<Typography
												variant="body2"
												fontFamily="monospace"
												sx={{ mt: 0.5 }}
											>
												{currentObject.graphId || "—"}
											</Typography>
										}
									/>
								</ListItem>
							</List>
						</CardContent>
					</Card>
				</Box>

				{/* Информация о процессе */}
				<Box>
					<Card>
						<CardContent>
							<Flex alignItems="center" gap={8} sx={{ mb: 2 }}>
								<AccountTreeIcon color="primary" />
								<Typography variant="h6">Информация о процессе</Typography>
							</Flex>
							<Divider sx={{ mb: 2 }} />
							<List dense>
								<ListItem>
									<ListItemText
										primary="Процесс"
										secondary={
											<Typography
												variant="body2"
												fontFamily="monospace"
												sx={{ mt: 0.5 }}
											>
												{currentObject.process}
											</Typography>
										}
									/>
								</ListItem>
								<ListItem>
									<ListItemText
										primary="Описание процесса"
										secondary={currentObject.processDescription || "—"}
									/>
								</ListItem>
							</List>
						</CardContent>
					</Card>
				</Box>

				{/* Связанные объекты */}
				<Box>
					<Card>
						<CardContent>
							<Flex alignItems="center" gap={8} sx={{ mb: 2 }}>
								<DescriptionIcon color="primary" />
								<Typography variant="h6">
									{currentObject.objectType === "Признак"
										? "Родительская модель"
										: "Признаки"}
								</Typography>
							</Flex>
							<Divider sx={{ mb: 2 }} />
							{relatedObjects.length > 0 ? (
								<List dense>
									{relatedObjects.map((obj) => (
										<ListItem
											key={obj.id}
											sx={{
												cursor: "pointer",
												"&:hover": {
													backgroundColor: "action.hover",
												},
											}}
											onClick={() =>
												navigate(`/objects/${encodeURIComponent(obj.id)}`)
											}
										>
											<ListItemText
												primary={obj.object}
												secondary={
													<Flex alignItems="center" gap={4} sx={{ mt: 0.5 }}>
														<Chip
															label={obj.objectType}
															color={getTypeColor(obj.objectType) as any}
															size="small"
														/>
														{obj.description && (
															<Typography
																variant="caption"
																color="text.secondary"
															>
																{obj.description}
															</Typography>
														)}
													</Flex>
												}
											/>
										</ListItem>
									))}
								</List>
							) : (
								<Typography variant="body2" color="text.secondary">
									Связанные объекты не найдены
								</Typography>
							)}
						</CardContent>
					</Card>
				</Box>
			</Flex>
		</Box>
	);
};
