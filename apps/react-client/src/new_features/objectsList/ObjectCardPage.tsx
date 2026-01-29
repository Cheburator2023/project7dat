import React, { useMemo, useState, useCallback } from "react";
import { useParams } from "react-router";
import { Layout, Model, TabNode, Action } from "flexlayout-react";
import { CircularProgress, styled } from "@mui/material";
import { Header } from "@react-client/common/navigation/organisms/Header";
import { Flex } from "@react-client/common/primitives/Flex";
import { usePanelSettingsStore } from "@react-client/common/store/panelSettingsStore";
import { useCurrentDataLineageGraph } from "@react-client/api/hooks";
import type { JsonDataItem } from "@react-client/api/hooks/jsonDataApi";
import {
	ObjectDetailsView,
	ObjectRelatedView,
	ObjectJsonView,
	ObjectGraphView,
} from "./components";
import type { ObjectItem, AttributeConnection } from "./types";
import { useDataLineageStore } from "@react-client/stores/dataLineageStore";
import { useShallow } from "zustand/react/shallow";

const flexLayoutJson = {
	global: {
		tabEnableClose: false,
		tabEnableRename: false,
		tabSetEnableTabStrip: true,
		tabSetEnableDrop: true,
		tabSetEnableDrag: true,
		tabSetEnableClose: false,
		tabSetEnableMaximize: true,
	},
	borders: [],
	layout: {
		type: "row",
		weight: 100,
		children: [
			{
				type: "tabset",
				weight: 50,
				children: [
					{
						type: "tab",
						name: "Детали",
						component: "object-details",
						id: "object-details-tab",
					},
					{
						type: "tab",
						name: "Связи",
						component: "object-related",
						id: "object-related-tab",
					},
					{
						type: "tab",
						name: "Граф",
						component: "object-graph",
						id: "object-graph-tab",
					},
				],
			},
		],
	},
};

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
			id: `${entity.id}`,
			graphId,
			object: entity.name ?? entity.id,
			objectType: entity.type as any,
			description: entity.description,
			modelId: entity.id,
			database,
			process,
			processDescription,
		});

		if (entity.attrSeq) {
			for (const attr of entity.attrSeq) {
				rows.push({
					id: `${entity.id}::${attr.name}`,
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

// Extract attribute connections from mappings
const extractAttributeConnections = (
	jsonDataList: JsonDataItem[],
): AttributeConnection[] => {
	const connections: AttributeConnection[] = [];

	for (const item of jsonDataList) {
		const { id: graphId, data } = item;
		const entities = data?.entities || [];
		const mappings = data?.mappings || [];

		// Create entity name lookup
		const entityNameMap = new Map<string, string>();
		for (const entity of entities) {
			entityNameMap.set(entity.id, entity.name ?? entity.id);
		}

		// Extract attribute mappings from each mapping
		for (const mapping of mappings) {
			const targetEntityId = mapping.entityId;
			const targetEntityName =
				entityNameMap.get(targetEntityId) ?? targetEntityId;

			for (const dep of mapping.deps || []) {
				const sourceEntityId = dep.entityId;
				const sourceEntityName =
					entityNameMap.get(sourceEntityId) ?? sourceEntityId;

				for (const attrMap of dep.attrMaps || []) {
					connections.push({
						sourceEntityId: `${graphId}::${sourceEntityId}`,
						sourceEntityName,
						sourceAttr: attrMap.src,
						targetEntityId: `${graphId}::${targetEntityId}`,
						targetEntityName,
						targetAttr: attrMap.dst,
						graphId,
					});
				}
			}
		}
	}

	return connections;
};

export const ObjectCardPage: React.FC = () => {
	const { objectId } = useParams<{ objectId: string }>();
	const { currentGraph } = useDataLineageStore(
		useShallow((state) => ({
			currentGraph: state.currentGraph,
		})),
	);
	const { isPending } = useCurrentDataLineageGraph();
	// const { data: jsonDataList, isLoading, error } = useJsonDataList();

	const isPersistEnabled = usePanelSettingsStore((state) =>
		state.isPanelPersistEnabled("object-card"),
	);

	const [model, _setModel] = useState(() => {
		const { isPanelPersistEnabled } = usePanelSettingsStore.getState();
		if (isPanelPersistEnabled("object-card")) {
			try {
				const savedLayout = localStorage.getItem("object-card-layout");
				if (savedLayout) {
					return Model.fromJson(JSON.parse(savedLayout));
				}
			} catch (error) {
				console.warn("Failed to load layout from localStorage:", error);
			}
		}
		return Model.fromJson(flexLayoutJson);
	});

	const allObjects = useMemo<ObjectItem[]>(() => {
		if (!currentGraph) {
			return [];
		}
		return [{ data: currentGraph }].flatMap(mapJsonDataItemToObjects);
	}, [currentGraph]);

	const currentObject = useMemo(() => {
		if (!objectId) return null;
		const decodedId = decodeURIComponent(objectId);
		console.log(allObjects.find((obj) => obj.id === decodedId) ?? null);
		return allObjects.find((obj) => obj.id === decodedId) ?? null;
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

	// Extract all attribute connections from mappings
	const allAttributeConnections = useMemo(() => {
		if (!currentGraph) return [];
		return extractAttributeConnections([currentGraph]);
	}, [currentGraph]);

	// Filter connections relevant to current object
	const relevantConnections = useMemo(() => {
		if (!currentObject) return [];

		// Get the entity ID (modelId for attributes, id prefix for entities)
		const entityId =
			currentObject.objectType === "Признак"
				? `${currentObject.graphId}::${currentObject.modelId}`
				: currentObject.id;

		// Find connections where this entity is source or target
		return allAttributeConnections.filter(
			(conn) =>
				conn.sourceEntityId === entityId || conn.targetEntityId === entityId,
		);
	}, [currentObject, allAttributeConnections]);

	const factory = useCallback(
		(node: TabNode) => {
			const component = node.getComponent();

			switch (component) {
				case "object-graph":
					return (
						<ObjectContainer>
							<ObjectGraphView
								object={currentObject}
								relatedObjects={relatedObjects}
								allObjects={allObjects}
								attributeConnections={relevantConnections}
							/>
						</ObjectContainer>
					);
				case "object-details":
					return (
						<ObjectContainer>
							<ObjectDetailsView object={currentObject} />
						</ObjectContainer>
					);
				case "object-related":
					return (
						<ObjectContainer>
							<ObjectRelatedView
								object={currentObject}
								relatedObjects={relatedObjects}
							/>
						</ObjectContainer>
					);
				case "object-json":
					return (
						<ObjectContainer>
							<ObjectJsonView object={currentObject} />
						</ObjectContainer>
					);
				default:
					return <div>Unknown component: {component}</div>;
			}
		},
		[currentObject, relatedObjects, allObjects, relevantConnections],
	);

	const onAction = useCallback(
		(action: Action) => {
			const result = action;

			if (isPersistEnabled) {
				setTimeout(() => {
					try {
						const layoutJson = model.toJson();
						localStorage.setItem(
							"object-card-layout",
							JSON.stringify(layoutJson),
						);
					} catch (error) {
						console.warn("Failed to save layout to localStorage:", error);
					}
				}, 0);
			}

			return result;
		},
		[model, isPersistEnabled],
	);

	if (isPending) {
		return (
			<Flex
				width="100%"
				height="100%"
				justifyContent="center"
				alignItems="center"
			>
				<CircularProgress />
			</Flex>
		);
	}

	// if (error) {
	// 	return (
	// 		<div>
	// 			<Header />
	// 			<Wrapper>
	// 				<div style={{ padding: "20px", textAlign: "center" }}>
	// 					Ошибка загрузки объекта: {error.message}
	// 				</div>
	// 			</Wrapper>
	// 		</div>
	// 	);
	// }

	if (!currentObject) {
		return (
			<div>
				<Header />
				<Wrapper>
					<div style={{ padding: "20px", textAlign: "center" }}>
						Объект с ID "{objectId ? decodeURIComponent(objectId) : ""}" не
						найден.
					</div>
				</Wrapper>
			</div>
		);
	}

	return (
		<div>
			<Header />
			<Wrapper id="object_card_container">
				<FlexLayoutContainer>
					<Layout
						model={model}
						factory={factory}
						onAction={onAction}
						realtimeResize
					/>
				</FlexLayoutContainer>
			</Wrapper>
		</div>
	);
};

const FlexLayoutContainer = styled("div")(({ theme }) => {
	return {
		position: "absolute",
		width: "100%",
		height: "100%",
		left: 0,
		top: 0,
		zIndex: 1,
		pointerEvents: "auto",
		backgroundColor: "transparent",
		color: theme.vars?.palette?.text.primary,
		"& .flexlayout__layout": {
			backgroundColor: "transparent",
		},
		"& .flexlayout__tab": {
			backgroundColor: theme.vars?.palette?.background.paper,
			color: theme.vars?.palette?.text.primary,
			borderColor: theme.vars?.palette?.divider,
			borderRadius: "8px",
		},
		"& .flexlayout__tab_selected": {
			backgroundColor: theme.vars?.palette?.background.default,
			color: theme.vars?.palette?.text.primary,
		},
		"& .flexlayout__tabset-selected": {
			backgroundColor: theme.vars?.palette?.action.selected,
			borderColor: theme.vars?.palette?.primary.main,
		},
		"& .flexlayout__tabset_header": {
			backgroundColor: theme.vars?.palette?.background.paper,
			borderColor: theme.vars?.palette?.divider,
		},
		"& .flexlayout__tab_button": {
			backgroundColor: "transparent",
			color: theme.vars?.palette?.text.secondary,
			border: "none",
			padding: "5px 0",
			"&:hover": {
				backgroundColor: theme.vars?.palette?.action.hover,
				color: theme.vars?.palette?.text.primary,
			},
		},
		"& .flexlayout__tabset_tabbar_outer": {
			backgroundColor: theme.vars?.palette?.background.paper,
			borderBottom: "1px solid rgb(83 83 83 / 30%)",
		},
		"& .flexlayout__tab_button_selected": {
			backgroundColor: theme.vars?.palette?.action.selected,
			color: theme.vars?.palette?.primary.main,
			fontWeight: 600,
		},
		"& .flexlayout__tabset_content": {
			backgroundColor: theme.vars?.palette?.background.default,
		},
		"& .flexlayout__border": {
			backgroundColor: theme.vars?.palette?.background.paper,
			borderColor: theme.vars?.palette?.divider,
		},
		"& .flexlayout__outline_rect": {
			borderColor: theme.vars?.palette?.primary.main,
		},
		"& .flexlayout__tabset": {
			// @ts-expect-error
			fontFamily: theme.vars?.font.inherit,
			borderRadius: "8px",
			border: "1px solid #a5aaba90",
			margin: "4px",
			zoom: 0.8,
			backgroundColor: theme.vars?.palette?.background.paper,
		},
		"& .flexlayout__splitter": {
			backgroundColor: theme.vars?.palette?.divider,
			borderRadius: "8px",
			width: "4px !important",
			minWidth: "4px !important",
		},
		"& .flexlayout__splitter.flexlayout__splitter_vert": {
			backgroundColor: theme.vars?.palette?.divider,
			borderRadius: "8px",
			height: "4px !important",
			minHeight: "4px !important",
			width: "inherit !important",
			minWidth: "inherit !important",
		},
		"& .flexlayout__splitter_vert": {
			margin: "0 6px",
		},
		"& .flexlayout__splitter_horz": {
			margin: "6px 0",
		},
		"& .flexlayout__tab_button_content": {
			padding: "4px 9px",
			borderRadius: "8px",
			backgroundColor: "#488ecb1a",
		},
	};
});

const ObjectContainer = styled("div")(
	({ theme }) => `
	height: 100%;
	width: 100%;
	background-color: ${theme.vars?.palette?.background.paper};
	color: ${theme.vars?.palette?.text.primary};
`,
);

const Wrapper = styled("div")(
	({ theme }) => `
	height: calc(100vh - 64px);
	position: relative;
	background-color: transparent;
	color: ${theme.vars?.palette?.text.primary};
`,
);
