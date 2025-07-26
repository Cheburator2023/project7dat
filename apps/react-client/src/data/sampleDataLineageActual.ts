import { DataLineageGraph } from "../types/dataLineage";

export const sampleDataLineageActual: DataLineageGraph = {
	desc: {
		appId: "spark-app-001",
		appName: "Обработка данных клиентов",
	},
	entities: [
		{
			id: "raw.customers",
			modified: false,
			type: "table",
			namespace: "raw",
			name: "customers",
			attrSeq: [
				{
					name: "customer_id",
					type: "bigint",
					comment: "Уникальный идентификатор клиента",
				},
				{
					name: "first_name",
					type: "string",
					comment: "Имя клиента",
				},
				{
					name: "last_name",
					type: "string",
					comment: "Фамилия клиента",
				},
				{
					name: "email",
					type: "string",
					comment: "Электронная почта",
				},
				{
					name: "phone",
					type: "string",
					comment: "Номер телефона",
				},
				{
					name: "created_at",
					type: "timestamp",
					comment: "Дата создания записи",
				},
			],
		},
		{
			id: "raw.orders",
			modified: false,
			type: "table",
			namespace: "raw",
			name: "orders",
			attrSeq: [
				{
					name: "order_id",
					type: "bigint",
					comment: "Уникальный идентификатор заказа",
				},
				{
					name: "customer_id",
					type: "bigint",
					comment: "Идентификатор клиента",
				},
				{
					name: "order_date",
					type: "date",
					comment: "Дата заказа",
				},
				{
					name: "total_amount",
					type: "decimal(10,2)",
					comment: "Общая сумма заказа",
				},
				{
					name: "status",
					type: "string",
					comment: "Статус заказа",
				},
			],
		},
		{
			id: "analytics.customer_summary",
			modified: true,
			type: "table",
			namespace: "analytics",
			name: "customer_summary",
			attrSeq: [
				{
					name: "customer_id",
					type: "bigint",
					comment: "Уникальный идентификатор клиента",
				},
				{
					name: "full_name",
					type: "string",
					comment: "Полное имя клиента",
				},
				{
					name: "email",
					type: "string",
					comment: "Электронная почта",
				},
				{
					name: "total_orders",
					type: "bigint",
					comment: "Общее количество заказов",
				},
				{
					name: "total_spent",
					type: "decimal(12,2)",
					comment: "Общая сумма потраченных средств",
				},
				{
					name: "avg_order_value",
					type: "decimal(10,2)",
					comment: "Средняя стоимость заказа",
				},
				{
					name: "last_order_date",
					type: "date",
					comment: "Дата последнего заказа",
				},
			],
		},
	],
	mappings: [
		{
			id: 1,
			entityId: "analytics.customer_summary",
			deps: [
				{
					entityId: "raw.customers",
					attrMaps: [
						{
							src: "customer_id",
							dst: "customer_id",
						},
						{
							src: "email",
							dst: "email",
						},
					],
					atrDeps: [
						{
							attr: "customer_id",
							linktypes: ["join"],
						},
						{
							attr: "first_name",
							linktypes: ["groupby"],
						},
						{
							attr: "last_name",
							linktypes: ["groupby"],
						},
					],
				},
				{
					entityId: "raw.orders",
					attrMaps: [
						{
							src: "customer_id",
							dst: "customer_id",
						},
						{
							src: "total_amount",
							dst: "total_spent",
						},
						{
							src: "order_date",
							dst: "last_order_date",
						},
					],
					atrDeps: [
						{
							attr: "customer_id",
							linktypes: ["join", "groupby"],
						},
						{
							attr: "total_amount",
							linktypes: ["window"],
						},
						{
							attr: "order_date",
							linktypes: ["window"],
						},
					],
				},
			],
			unmatched: [],
		},
	],
};
