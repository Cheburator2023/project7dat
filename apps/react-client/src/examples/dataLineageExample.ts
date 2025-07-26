import type { DataLineageGraph } from "@react-client/types/dataLineage";

export const dataLineageExample: DataLineageGraph = {
	desc: {
		appId: "spark-app-12345",
		appName: "Обработка данных клиентов",
	},
	entities: [
		{
			id: "raw_customers",
			modified: false,
			type: "table",
			namespace: "raw_data",
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
					comment: "Электронная почта клиента",
				},
				{
					name: "phone",
					type: "string",
					comment: "Номер телефона клиента",
				},
				{
					name: "registration_date",
					type: "timestamp",
					comment: "Дата регистрации клиента",
				},
			],
		},
		{
			id: "raw_orders",
			modified: false,
			type: "table",
			namespace: "raw_data",
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
					type: "timestamp",
					comment: "Дата создания заказа",
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
			id: "raw_products",
			modified: false,
			type: "table",
			namespace: "raw_data",
			name: "products",
			attrSeq: [
				{
					name: "product_id",
					type: "bigint",
					comment: "Уникальный идентификатор товара",
				},
				{
					name: "product_name",
					type: "string",
					comment: "Наименование товара",
				},
				{
					name: "category",
					type: "string",
					comment: "Категория товара",
				},
				{
					name: "price",
					type: "decimal(8,2)",
					comment: "Цена товара",
				},
			],
		},
		{
			id: "customer_analytics_view",
			modified: true,
			type: "view",
			namespace: "analytics",
			name: "customer_analytics",
			attrSeq: [
				{
					name: "customer_id",
					type: "bigint",
					comment: "Идентификатор клиента",
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
					type: "timestamp",
					comment: "Дата последнего заказа",
				},
				{
					name: "customer_segment",
					type: "string",
					comment: "Сегмент клиента",
				},
			],
		},
		{
			id: "product_sales_summary",
			modified: true,
			type: "table",
			namespace: "analytics",
			name: "product_sales_summary",
			attrSeq: [
				{
					name: "product_id",
					type: "bigint",
					comment: "Идентификатор товара",
				},
				{
					name: "product_name",
					type: "string",
					comment: "Наименование товара",
				},
				{
					name: "category",
					type: "string",
					comment: "Категория товара",
				},
				{
					name: "total_sales",
					type: "decimal(15,2)",
					comment: "Общая сумма продаж",
				},
				{
					name: "units_sold",
					type: "bigint",
					comment: "Количество проданных единиц",
				},
				{
					name: "avg_price",
					type: "decimal(8,2)",
					comment: "Средняя цена продажи",
				},
			],
		},
	],
	mappings: [
		{
			id: 1,
			entityId: "customer_analytics_view",
			deps: [
				{
					entityId: "raw_customers",
					attrMaps: [
						{
							src: "customer_id",
							dst: "customer_id",
						},
						{
							src: "first_name",
							dst: "full_name",
						},
						{
							src: "last_name",
							dst: "full_name",
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
					entityId: "raw_orders",
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
							src: "total_amount",
							dst: "avg_order_value",
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
						{
							attr: "status",
							linktypes: ["where"],
						},
					],
				},
			],
		},
		{
			id: 2,
			entityId: "product_sales_summary",
			deps: [
				{
					entityId: "raw_products",
					attrMaps: [
						{
							src: "product_id",
							dst: "product_id",
						},
						{
							src: "product_name",
							dst: "product_name",
						},
						{
							src: "category",
							dst: "category",
						},
						{
							src: "price",
							dst: "avg_price",
						},
					],
					atrDeps: [
						{
							attr: "product_id",
							linktypes: ["join", "groupby"],
						},
						{
							attr: "product_name",
							linktypes: ["groupby"],
						},
						{
							attr: "category",
							linktypes: ["groupby"],
						},
					],
				},
				{
					entityId: "raw_orders",
					attrMaps: [
						{
							src: "total_amount",
							dst: "total_sales",
						},
					],
					atrDeps: [
						{
							attr: "customer_id",
							linktypes: ["join"],
						},
						{
							attr: "total_amount",
							linktypes: ["window"],
						},
						{
							attr: "status",
							linktypes: ["where"],
						},
					],
				},
			],
			unmatched: [
				"Некоторые заказы без привязки к товарам",
				"Товары без продаж в анализируемом периоде",
			],
		},
	],
};
