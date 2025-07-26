// @ts-nocheck
import React, { useState } from "react";
import { Tabs, Table, Card, Tag, Collapse, Descriptions, Alert } from "antd";
import TabPane from "antd/es/tabs/TabPane";

const data = {
	desc: {
		appId: "spark-application-123",
		appName: "Data Mart ETL Job",
	},
	entities: [
		{
			id: "source_table_1",
			modified: false,
			type: "table",
			namespace: "sales",
			name: "transactions",
			attrSeq: [
				{
					name: "transaction_id",
					type: "bigint",
					comment: "Unique transaction identifier",
				},
				{
					name: "customer_id",
					type: "bigint",
					comment: "Customer reference",
				},
				{
					name: "amount",
					type: "decimal(18,2)",
					comment: "Transaction amount",
				},
			],
		},
		{
			id: "source_table_2",
			modified: false,
			type: "table",
			namespace: "customers",
			name: "customer_info",
			attrSeq: [
				{
					name: "customer_id",
					type: "bigint",
					comment: "Primary key",
				},
				{
					name: "customer_name",
					type: "varchar(100)",
					comment: "Customer full name",
				},
			],
		},
		{
			id: "target_datamart",
			modified: true,
			type: "table",
			namespace: "dwh",
			name: "sales_datamart",
			attrSeq: [
				{
					name: "transaction_id",
					type: "bigint",
					comment: "Transaction reference",
				},
				{
					name: "customer_id",
					type: "bigint",
					comment: "Customer reference",
				},
				{
					name: "customer_name",
					type: "varchar(100)",
					comment: "Customer full name",
				},
				{
					name: "transaction_amount",
					type: "decimal(18,2)",
					comment: "Amount in USD",
				},
			],
		},
	],
	mappings: [
		{
			id: 1,
			entityId: "target_datamart",
			deps: [
				{
					entityId: "source_table_1",
					attrMaps: [
						{
							src: "transaction_id",
							dst: "transaction_id",
						},
						{
							src: "customer_id",
							dst: "customer_id",
						},
						{
							src: "amount",
							dst: "transaction_amount",
						},
					],
					atrDeps: [
						{
							attr: "customer_id",
							linktypes: ["join"],
						},
						{
							attr: "amount",
							linktypes: ["window"],
						},
					],
				},
				{
					entityId: "source_table_2",
					attrMaps: [
						{
							src: "customer_id",
							dst: "customer_id",
						},
						{
							src: "customer_name",
							dst: "customer_name",
						},
					],
					atrDeps: [
						{
							attr: "customer_id",
							linktypes: ["join"],
						},
					],
				},
			],
			unmatched: [],
		},
	],
};

const { Panel } = Collapse; // Добавляем импорт Panel

// Типы данных
type Attribute = {
	name: string;
	type: string;
	comment?: string;
};

type EntityType = "table" | "view";

type Entity = {
	id: string;
	modified: boolean; // true для DataMart
	type: EntityType;
	namespace: string;
	name: string;
	attrSeq: Attribute[];
};

type AttributeMapping = {
	src: string;
	dst: string;
};

type LinkType = "window" | "join" | "where" | "groupby";

type AttributeDependency = {
	attr: string;
	linktypes?: LinkType[];
};

type Dependency = {
	entityId: string;
	attrMaps?: AttributeMapping[];
	atrDeps?: AttributeDependency[];
};

type Mapping = {
	id: number;
	entityId: string; // ID DataMart (таргета)
	deps: Dependency[];
	unmatched?: any[];
};

type AppDescription = {
	appId: string;
	appName: string;
};

type DataMartLineageData = {
	desc: AppDescription;
	entities: Entity[];
	mappings: Mapping[];
};

// Пропсы для дочерних компонентов
type EntitiesTableProps = {
	entities: Entity[];
	showType: boolean;
};

type LineageVisualizationProps = {
	entities: Entity[];
	mappings: Mapping[];
};

type MappingsAccordionProps = {
	mappings: Mapping[];
	entities: Entity[];
};

type AttributesTableProps = {
	attributes?: Attribute[];
};

// Компонент таблицы атрибутов
const AttributesTable: React.FC<AttributesTableProps> = ({ attributes }) => {
	if (!attributes || attributes.length === 0) return null;

	return (
		<Table
			dataSource={attributes}
			columns={[
				{ title: "Name", dataIndex: "name", key: "name" },
				{ title: "Type", dataIndex: "type", key: "type" },
				{ title: "Comment", dataIndex: "comment", key: "comment" },
			]}
			size="small"
			pagination={false}
			rowKey="name"
		/>
	);
};

// Компонент аккордеона для маппингов
const MappingsAccordion: React.FC<MappingsAccordionProps> = ({
	mappings,
	entities,
}) => {
	return (
		<Collapse accordion>
			{mappings.map((mapping) => {
				const targetEntity = entities.find((e) => e.id === mapping.entityId);
				return (
					<Panel
						header={
							<>
								Mapping #{mapping.id} →
								<Tag color="red" style={{ marginLeft: 8 }}>
									DATA MART
								</Tag>
								{targetEntity?.name || mapping.entityId}
							</>
						}
						key={mapping.id}
					>
						<div style={{ marginBottom: 16 }}>
							<h4>Target: {targetEntity?.name || mapping.entityId}</h4>
							<AttributesTable attributes={targetEntity?.attrSeq} />
						</div>

						{mapping.deps.map((dep, idx) => {
							const sourceEntity = entities.find((e) => e.id === dep.entityId);
							return (
								<div
									key={idx}
									style={{
										marginBottom: 16,
										padding: 16,
										background: "#f9f9f9",
									}}
								>
									<h4>Source: {sourceEntity?.name || dep.entityId}</h4>
									<AttributesTable attributes={sourceEntity?.attrSeq} />

									<h5 style={{ marginTop: 16 }}>Attribute Mappings</h5>
									<Table
										dataSource={dep.attrMaps}
										columns={[
											{ title: "Source", dataIndex: "src", key: "src" },
											{ title: "Target", dataIndex: "dst", key: "dst" },
										]}
										size="small"
										pagination={false}
										rowKey="src"
									/>

									{dep.atrDeps && dep.atrDeps.length > 0 && (
										<>
											<h5 style={{ marginTop: 16 }}>Attribute Dependencies</h5>
											{dep.atrDeps.map((attrDep, i) => (
												<div key={i} style={{ marginBottom: 8 }}>
													<strong>{attrDep.attr}:</strong>{" "}
													{attrDep.linktypes?.map((type, j) => (
														<Tag key={j} style={{ marginRight: 4 }}>
															{type}
														</Tag>
													))}
												</div>
											))}
										</>
									)}
								</div>
							);
						})}
					</Panel>
				);
			})}
		</Collapse>
	);
};

// Компонент таблицы сущностей
const EntitiesTable: React.FC<EntitiesTableProps> = ({
	entities,
	showType,
}) => {
	const columns = [
		{
			title: "ID",
			dataIndex: "id",
			key: "id",
		},
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			render: (text: string, record: Entity) => (
				<>
					{text}
					{record.modified && (
						<Tag color="red" style={{ marginLeft: 8 }}>
							DATA MART
						</Tag>
					)}
				</>
			),
		},
		...(showType
			? [
					{
						title: "Type",
						dataIndex: "type",
						key: "type",
						render: (type: EntityType) => (
							<Tag color={type === "table" ? "blue" : "green"}>{type}</Tag>
						),
					},
				]
			: []),
		{
			title: "Namespace",
			dataIndex: "namespace",
			key: "namespace",
		},
		{
			title: "Attributes",
			dataIndex: "attrSeq",
			key: "attributes",
			render: (attrs: Attribute[]) => attrs.length,
		},
	];

	return (
		<Table
			dataSource={entities}
			columns={columns}
			rowKey="id"
			pagination={false}
			size="small"
		/>
	);
};

// Компонент визуализации lineage (заглушка)
const LineageVisualization: React.FC<LineageVisualizationProps> = ({
	entities,
	mappings,
}) => {
	return (
		<div className="lineage-graph">
			<Alert
				message="Lineage Visualization"
				description="This would display a graph showing relationships between sources and data marts based on the mappings."
				type="info"
				showIcon
			/>
			<div
				style={{
					height: 400,
					border: "1px dashed #ddd",
					borderRadius: 4,
					marginTop: 16,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#fafafa",
				}}
			>
				Graph visualization would be implemented here
			</div>
		</div>
	);
};

// Основной компонент
const DataMartLineageUI: React.FC<{ data?: DataMartLineageData }> = () => {
	const [activeTab, setActiveTab] = useState("lineage");

	// Получаем DataMart (таргетные сущности) и источники
	const dataMarts = data.entities.filter((e) => e.modified);
	const sourceEntities = data.entities.filter((e) => !e.modified);

	return (
		<div style={{ padding: 16 }}>
			{/* Заголовок с информацией о приложении */}
			<Card title="Spark Application Info" style={{ marginBottom: 16 }}>
				<Descriptions bordered size="small">
					<Descriptions.Item label="Application ID">
						{data.desc.appId}
					</Descriptions.Item>
					<Descriptions.Item label="Application Name">
						{data.desc.appName}
					</Descriptions.Item>
					<Descriptions.Item label="DataMarts">
						<Tag color="red">{dataMarts.length}</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Sources">
						<Tag color="green">{sourceEntities.length}</Tag>
					</Descriptions.Item>
				</Descriptions>
			</Card>

			{/* Блок с информацией о DataMart */}
			{dataMarts.length > 0 && (
				<Card
					title={
						<>
							<Tag color="red">DATA MARTS</Tag>
							<span style={{ marginLeft: 8 }}>Target Entities</span>
						</>
					}
					style={{ marginBottom: 16 }}
					type="inner"
				>
					<EntitiesTable entities={dataMarts} showType={false} />
				</Card>
			)}

			{/* Основные табы */}
			<Tabs activeKey={activeTab} onChange={setActiveTab}>
				<TabPane tab="Data Lineage" key="lineage">
					<LineageVisualization
						entities={data.entities}
						mappings={data.mappings}
					/>
				</TabPane>

				<TabPane tab="Source Entities" key="sources">
					<EntitiesTable entities={sourceEntities} showType={true} />
				</TabPane>

				<TabPane tab="Mappings" key="mappings">
					<MappingsAccordion
						mappings={data.mappings}
						entities={data.entities}
					/>
				</TabPane>
			</Tabs>
		</div>
	);
};

export default DataMartLineageUI;
