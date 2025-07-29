import type { DataLineageGraph } from "@react-client/types/dataLineage";

export const dataLineageExample: DataLineageGraph = {
	desc: {
		appId: "application_1741031136784_106640",
		appName:
			"1642_25_dapp_clcd_client_profile_int_data.dapp_clcd_client_profile_int_data",
	},
	entities: [
		{
			id: "prod_dm_dadm_corp_wide/tmp_analitical",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_analitical",
			attrSeq: [
				{
					name: "report_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "processed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "org_nm",
					type: "STRING",
					comment: "",
				},
				{
					name: "industry_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "industry_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "gbl",
					type: "STRING",
					comment: "",
				},
				{
					name: "gsl_slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "gsl_name",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_local",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_local",
			attrSeq: [
				{
					name: "slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "processed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "parametertypeentry_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "problem_flag",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_segment",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_segment",
			attrSeq: [
				{
					name: "slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "segment_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "segment_name",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_sales_point",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_sales_point",
			attrSeq: [
				{
					name: "id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "sales_point_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "sales_point_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "detailed_region_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "region_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "region_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "detailed_region_name",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_client_hist",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_client_hist",
			attrSeq: [
				{
					name: "report_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clientid",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "processed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "client_type_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "org_nm",
					type: "STRING",
					comment: "",
				},
				{
					name: "industry_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "industry_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "gbl",
					type: "STRING",
					comment: "",
				},
				{
					name: "gsl_slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "gsl_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "problem_flag",
					type: "STRING",
					comment: "",
				},
				{
					name: "segment_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "segment_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sales_point_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "sales_point_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "detailed_region_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "region_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "region_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "detailed_region_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "report_date_part",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_cl_inn_inf",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_cl_inn_inf",
			attrSeq: [
				{
					name: "clientid",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "salt_num_inn",
					type: "INT",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_first_acc_date",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_first_acc_date",
			attrSeq: [
				{
					name: "inn",
					type: "STRING",
					comment: "ИНН из КИХ",
				},
				{
					name: "first_acc_date",
					type: "TIMESTAMP",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_cl_look",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_cl_look",
			attrSeq: [
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "salt_num_inn",
					type: "INT",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_client_union",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_client_union",
			attrSeq: [
				{
					name: "clntuh_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_start_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clntuh_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clntuh_inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "salt_num_inn_cl",
					type: "INT",
					comment: "",
				},
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "salt_num_inn",
					type: "INT",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_client",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_client",
			attrSeq: [
				{
					name: "clnth_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_union_clntu_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_start_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_client_join",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_client_join",
			attrSeq: [
				{
					name: "clnth_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "count",
					type: "BIGINT",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_account",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_account",
			attrSeq: [
				{
					name: "acnth_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_clnt_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_open_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_start_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "count",
					type: "BIGINT",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_min_date_step1",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_min_date_step1",
			attrSeq: [
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_start_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clntuh_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_min_date_step2",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_min_date_step2",
			attrSeq: [
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_start_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clntuh_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_start_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_min_date_step3",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_min_date_step3",
			attrSeq: [
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "report_date_part",
					type: "STRING",
					comment: "",
				},
				{
					name: "first_acc_date",
					type: "TIMESTAMP",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tech_kih_client_acc_information",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tech_kih_client_acc_information",
			attrSeq: [
				{
					name: "inn",
					type: "STRING",
					comment: "ИНН из КИХ",
				},
				{
					name: "first_acc_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "report_date_part",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/int_data_tmp",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "int_data_tmp",
			attrSeq: [
				{
					name: "report_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clientid",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "client_type_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "org_nm",
					type: "STRING",
					comment: "",
				},
				{
					name: "gsl_slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "gsl_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "problem_flag",
					type: "STRING",
					comment: "",
				},
				{
					name: "segment_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "segment_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sales_point_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "sales_point_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "industry_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "industry_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "first_acc_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "gbl",
					type: "STRING",
					comment: "",
				},
				{
					name: "gbl_detail",
					type: "STRING",
					comment: "",
				},
				{
					name: "active_flg",
					type: "INT",
					comment: "",
				},
				{
					name: "default_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "rating",
					type: "STRING",
					comment: "",
				},
				{
					name: "pd",
					type: "STRING",
					comment: "",
				},
				{
					name: "stop_list_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "region_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "region_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "detailed_region_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "detailed_region_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "refusal_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "bank_client_date_from",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "n_founders",
					type: "INT",
					comment: "",
				},
				{
					name: "founders_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "foreign_tax_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "report_date_part",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/tmp_new_spark_status_delete",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "tmp_new_spark_status_delete",
			attrSeq: [
				{
					name: "report_date",
					type: "STRING",
					comment: "",
				},
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "Status_Type",
					type: "STRING",
					comment: "",
				},
				{
					name: "Status_GroupName",
					type: "STRING",
					comment: "",
				},
				{
					name: "cnt_prov_inn",
					type: "BIGINT",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/int_data_prev",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "int_data_prev",
			attrSeq: [
				{
					name: "report_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clientid",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "client_type_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "org_nm",
					type: "STRING",
					comment: "",
				},
				{
					name: "gsl_slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "gsl_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "problem_flag",
					type: "STRING",
					comment: "",
				},
				{
					name: "segment_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "segment_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sales_point_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "sales_point_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "industry_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "industry_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "first_acc_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "gbl",
					type: "STRING",
					comment: "",
				},
				{
					name: "gbl_detail",
					type: "STRING",
					comment: "",
				},
				{
					name: "active_flg",
					type: "INT",
					comment: "",
				},
				{
					name: "default_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "rating",
					type: "STRING",
					comment: "",
				},
				{
					name: "pd",
					type: "STRING",
					comment: "",
				},
				{
					name: "stop_list_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "region_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "region_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "detailed_region_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "detailed_region_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "refusal_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "bank_client_date_from",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "n_founders",
					type: "INT",
					comment: "",
				},
				{
					name: "founders_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "foreign_tax_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "duplicate_slxid",
					type: "INT",
					comment: "",
				},
				{
					name: "flg_liquidation",
					type: "STRING",
					comment: "",
				},
				{
					name: "error_control_sum_inn",
					type: "INT",
					comment: "",
				},
				{
					name: "processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "report_date_part",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/int_data_prev",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "int_data_prev",
			attrSeq: [
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "report_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clientid",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "client_type_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "org_nm",
					type: "STRING",
					comment: "",
				},
				{
					name: "gsl_slxid",
					type: "STRING",
					comment: "",
				},
				{
					name: "gsl_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "problem_flag",
					type: "STRING",
					comment: "",
				},
				{
					name: "segment_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "segment_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sales_point_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "sales_point_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "industry_id",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "industry_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "first_acc_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "gbl",
					type: "STRING",
					comment: "",
				},
				{
					name: "gbl_detail",
					type: "STRING",
					comment: "",
				},
				{
					name: "active_flg",
					type: "INT",
					comment: "",
				},
				{
					name: "default_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "rating",
					type: "STRING",
					comment: "",
				},
				{
					name: "pd",
					type: "STRING",
					comment: "",
				},
				{
					name: "stop_list_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "region_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "region_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "detailed_region_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "detailed_region_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "refusal_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "bank_client_date_from",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "n_founders",
					type: "INT",
					comment: "",
				},
				{
					name: "founders_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "foreign_tax_flag",
					type: "TINYINT",
					comment: "",
				},
				{
					name: "processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "report_date_part",
					type: "STRING",
					comment: "",
				},
				{
					name: "duplicate_slxid",
					type: "INT",
					comment: "",
				},
				{
					name: "flg_liquidation",
					type: "STRING",
					comment: "",
				},
				{
					name: "error_control_sum_inn",
					type: "INT",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/int_data_tmp_final",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "int_data_tmp_final",
			attrSeq: [
				{
					name: "report_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clientid",
					type: "DECIMAL(38,0)",
					comment: "Идентификатор клиента (ПКБ)",
				},
				{
					name: "client_type_id",
					type: "DECIMAL(38,0)",
					comment: "Идентификатор типа клиента из ПКБ",
				},
				{
					name: "slxid",
					type: "STRING",
					comment: "Код клиента в SalesLogix",
				},
				{
					name: "inn",
					type: "STRING",
					comment: "ИНН из КИХ",
				},
				{
					name: "org_nm",
					type: "STRING",
					comment: "Название организации",
				},
				{
					name: "gsl_slxid",
					type: "STRING",
					comment: "ID группы связанных лиц. Используем SLXID группы компаний",
				},
				{
					name: "gsl_name",
					type: "STRING",
					comment:
						"Наименование группы связанных лиц. Используем наименование ГК",
				},
				{
					name: "problem_flag",
					type: "STRING",
					comment: "Признак проблемности",
				},
				{
					name: "segment_id",
					type: "DECIMAL(38,0)",
					comment: "Сегмент (из ПКБ). Идентификатор сегмента",
				},
				{
					name: "segment_name",
					type: "STRING",
					comment: "Сегмент (из ПКБ). Наименование сегмента",
				},
				{
					name: "sales_point_id",
					type: "DECIMAL(38,0)",
					comment: "Точка продаж клиента. Идентификатор точки продаж",
				},
				{
					name: "sales_point_name",
					type: "STRING",
					comment: "Точка продаж клиента. Наименование точки продаж",
				},
				{
					name: "industry_id",
					type: "DECIMAL(38,0)",
					comment: "Отрасль (ПКБ). Идентификатор отрасли",
				},
				{
					name: "industry_name",
					type: "STRING",
					comment: "Отрасль (ПКБ). Наименование отрасли",
				},
				{
					name: "first_acc_date",
					type: "TIMESTAMP",
					comment: "Дата открытия первого счета",
				},
				{
					name: "gbl",
					type: "STRING",
					comment:
						"ГБЛ (глобальная бизнес-линия) (ПКБ). Значения: КИБ, СМБ, неклиентский бизнес",
				},
				{
					name: "gbl_detail",
					type: "STRING",
					comment:
						"ГБЛ (глобальная бизнес-линия) (ПКБ). Значения: ДРКРО, ДРКБО, ДРКБ, ДНПА, ФД",
				},
				{
					name: "active_flg",
					type: "INT",
					comment: "Флаг активности клиента (По методологии КРСМБ)",
				},
				{
					name: "default_flag",
					type: "TINYINT",
					comment: "Флаг нахождения в дефолте на отчетную дату",
				},
				{
					name: "rating",
					type: "STRING",
					comment: "Кредитный рейтинг клиента (буквенный)",
				},
				{
					name: "pd",
					type: "STRING",
					comment: "Вероятность дефолта",
				},
				{
					name: "stop_list_flag",
					type: "TINYINT",
					comment: "Флаг вхождения клиента в черный список",
				},
				{
					name: "region_cd",
					type: "STRING",
					comment: "Код укрупненного региона (буквенный)",
				},
				{
					name: "region_name",
					type: "STRING",
					comment: "Наименование укрупненного региона",
				},
				{
					name: "detailed_region_cd",
					type: "STRING",
					comment:
						"Код региона (согласно порядковому номеру из Конституции РФ)",
				},
				{
					name: "detailed_region_name",
					type: "STRING",
					comment: "Наименование региона",
				},
				{
					name: "refusal_flag",
					type: "TINYINT",
					comment: "Флаг отказа от маркетинговых коммуникаций",
				},
				{
					name: "bank_client_date_from",
					type: "TIMESTAMP",
					comment: "Дата, когда организация стала клиентом ВТБ",
				},
				{
					name: "n_founders",
					type: "INT",
					comment: "Количество учредителей",
				},
				{
					name: "founders_type",
					type: "STRING",
					comment: "Тип учредителей",
				},
				{
					name: "foreign_tax_flag",
					type: "TINYINT",
					comment:
						"Флаг налогового резидента ин. гос-ва (из анкеты онбординга)",
				},
				{
					name: "duplicate_slxid",
					type: "INT",
					comment: "Флаг наличия более одного slxid в разрезе ИНН",
				},
				{
					name: "flg_liquidation",
					type: "STRING",
					comment: "Флаг ликвидирован в стадии ликвидации",
				},
				{
					name: "error_control_sum_inn",
					type: "INT",
					comment: "Проверка контрольной суммы символов ИНН",
				},
				{
					name: "processed_dttm",
					type: "TIMESTAMP",
					comment: "Дата и время загрузки",
				},
				{
					name: "report_date_part",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/int_data_log",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "int_data_log",
			attrSeq: [
				{
					name: "process_dttm",
					type: "STRING",
					comment: "Дата время записи строки (лога) в таблицу",
				},
				{
					name: "status",
					type: "STRING",
					comment: "Статус лога одно из значений [OK, ERROR, WARNING]",
				},
				{
					name: "description",
					type: "STRING",
					comment: "Cообщение лога",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/int_data",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "int_data",
			attrSeq: [
				{
					name: "report_date",
					type: "TIMESTAMP",
					comment: "Отчетная дата, первый день следующего месяца",
				},
				{
					name: "clientid",
					type: "DECIMAL(38,0)",
					comment: "Идентификатор клиента (ПКБ)",
				},
				{
					name: "client_type_id",
					type: "DECIMAL(38,0)",
					comment: "Идентификатор типа клиента из ПКБ",
				},
				{
					name: "slxid",
					type: "STRING",
					comment: "Код клиента в SalesLogix",
				},
				{
					name: "inn",
					type: "STRING",
					comment: "ИНН из КИХ",
				},
				{
					name: "org_nm",
					type: "STRING",
					comment: "Название организации",
				},
				{
					name: "gsl_slxid",
					type: "STRING",
					comment: "ID группы связанных лиц. Используем SLXID группы компаний",
				},
				{
					name: "gsl_name",
					type: "STRING",
					comment:
						"Наименование группы связанных лиц. Используем наименование ГК",
				},
				{
					name: "problem_flag",
					type: "STRING",
					comment: "Признак проблемности",
				},
				{
					name: "segment_id",
					type: "DECIMAL(38,0)",
					comment: "Сегмент (из ПКБ). Идентификатор сегмента",
				},
				{
					name: "segment_name",
					type: "STRING",
					comment: "Сегмент (из ПКБ). Наименование сегмента",
				},
				{
					name: "sales_point_id",
					type: "DECIMAL(38,0)",
					comment: "Точка продаж клиента. Идентификатор точки продаж",
				},
				{
					name: "sales_point_name",
					type: "STRING",
					comment: "Точка продаж клиента. Наименование точки продаж",
				},
				{
					name: "industry_id",
					type: "DECIMAL(38,0)",
					comment: "Отрасль (ПКБ). Идентификатор отрасли",
				},
				{
					name: "industry_name",
					type: "STRING",
					comment: "Отрасль (ПКБ). Наименование отрасли",
				},
				{
					name: "first_acc_date",
					type: "TIMESTAMP",
					comment: "Дата открытия первого счета",
				},
				{
					name: "gbl",
					type: "STRING",
					comment:
						"ГБЛ (глобальная бизнес-линия) (ПКБ). Значения: КИБ, СМБ, неклиентский бизнес",
				},
				{
					name: "gbl_detail",
					type: "STRING",
					comment:
						"ГБЛ (глобальная бизнес-линия) (ПКБ). Значения: ДРКРО, ДРКБО, ДРКБ, ДНПА, ФД",
				},
				{
					name: "active_flg",
					type: "INT",
					comment: "Флаг активности клиента (По методологии КРСМБ)",
				},
				{
					name: "default_flag",
					type: "TINYINT",
					comment: "Флаг нахождения в дефолте на отчетную дату",
				},
				{
					name: "rating",
					type: "STRING",
					comment: "Кредитный рейтинг клиента (буквенный)",
				},
				{
					name: "pd",
					type: "STRING",
					comment: "Вероятность дефолта",
				},
				{
					name: "stop_list_flag",
					type: "TINYINT",
					comment: "Флаг вхождения клиента в черный список",
				},
				{
					name: "region_cd",
					type: "STRING",
					comment: "Код укрупненного региона (буквенный)",
				},
				{
					name: "region_name",
					type: "STRING",
					comment: "Наименование укрупненного региона",
				},
				{
					name: "detailed_region_cd",
					type: "STRING",
					comment:
						"Код региона (согласно порядковому номеру из Конституции РФ)",
				},
				{
					name: "detailed_region_name",
					type: "STRING",
					comment: "Наименование региона",
				},
				{
					name: "refusal_flag",
					type: "TINYINT",
					comment: "Флаг отказа от маркетинговых коммуникаций",
				},
				{
					name: "bank_client_date_from",
					type: "TIMESTAMP",
					comment: "Дата, когда организация стала клиентом ВТБ",
				},
				{
					name: "n_founders",
					type: "INT",
					comment: "Количество учредителей",
				},
				{
					name: "founders_type",
					type: "STRING",
					comment: "Тип учредителей",
				},
				{
					name: "foreign_tax_flag",
					type: "TINYINT",
					comment:
						"Флаг налогового резидента ин. гос-ва (из анкеты онбординга)",
				},
				{
					name: "duplicate_slxid",
					type: "INT",
					comment: "Флаг наличия более одного slxid в разрезе ИНН",
				},
				{
					name: "flg_liquidation",
					type: "STRING",
					comment: "Флаг ликвидирован в стадии ликвидации",
				},
				{
					name: "error_control_sum_inn",
					type: "INT",
					comment: "Проверка контрольной суммы символов ИНН",
				},
				{
					name: "processed_dttm",
					type: "TIMESTAMP",
					comment: "Дата и время загрузки",
				},
				{
					name: "report_date_part",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_dm_dadm_corp_wide/int_data_log_repl_tmp",
			modified: true,
			type: "table",
			namespace: "prod_dm_dadm_corp_wide",
			name: "int_data_log_repl_tmp",
			attrSeq: [
				{
					name: "process_dttm",
					type: "STRING",
					comment: "Дата время записи строки (лога) в таблицу",
				},
				{
					name: "status",
					type: "STRING",
					comment: "Статус лога одно из значений [OK, ERROR, WARNING]",
				},
				{
					name: "description",
					type: "STRING",
					comment: "Cообщение лога",
				},
			],
		},
		{
			id: "prod_repl_subo_csep/csep_analytical",
			modified: false,
			type: "table",
			namespace: "prod_repl_subo_csep",
			name: "csep_analytical",
			attrSeq: [
				{
					name: "commit_ts",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "op_seq",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_scn",
					type: "STRING",
					comment: "",
				},
				{
					name: "processed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "autogroup",
					type: "STRING",
					comment: "",
				},
				{
					name: "cib",
					type: "STRING",
					comment: "",
				},
				{
					name: "csc",
					type: "STRING",
					comment: "",
				},
				{
					name: "description_multitext_en",
					type: "STRING",
					comment: "",
				},
				{
					name: "description_multitext_ru",
					type: "STRING",
					comment: "",
				},
				{
					name: "identificationattributes_isdoubt",
					type: "STRING",
					comment: "",
				},
				{
					name: "identificationattributes_isfatcacrsidentification",
					type: "STRING",
					comment: "",
				},
				{
					name: "identificationattributes_isfnsdocumentsmatching",
					type: "STRING",
					comment: "",
				},
				{
					name: "identificationattributes_isidentified",
					type: "STRING",
					comment: "",
				},
				{
					name: "identificationattributes_ispersonalattendance",
					type: "STRING",
					comment: "",
				},
				{
					name: "identificationattributes_isposdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "identificationattributes_isselfcertificationdone",
					type: "STRING",
					comment: "",
				},
				{
					name: "identificationattributes_orgid",
					type: "STRING",
					comment: "",
				},
				{
					name: "identificationattributes_paramtypeidset",
					type: "STRING",
					comment: "",
				},
				{
					name: "profileclientindustryentryref_dictionaryref_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "profileclientindustryentryref_dictionaryref_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "profileclientindustryentryref_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "profileclientindustryentryref_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "kpps",
					type: "STRING",
					comment: "",
				},
				{
					name: "legalentitytype_legalentitytypevalues",
					type: "STRING",
					comment: "",
				},
				{
					name: "profilelegalformentryref_dictionaryref_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "profilelegalformentryref_dictionaryref_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "profilelegalformentryref_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "profilelegalformentryref_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "loyalty_organisationprofileloyalty_chkobyyear",
					type: "STRING",
					comment: "",
				},
				{
					name: "loyalty_organisationprofileloyalty_clientmonths",
					type: "STRING",
					comment: "",
				},
				{
					name: "loyalty_organisationprofileloyalty_lastperiod",
					type: "STRING",
					comment: "",
				},
				{
					name: "loyalty_organisationprofileloyalty_loyaltystatus",
					type: "STRING",
					comment: "",
				},
				{
					name: "loyalty_organisationprofileloyalty_productscount",
					type: "STRING",
					comment: "",
				},
				{
					name: "name_organisationname_fullname_multitext_en",
					type: "STRING",
					comment: "",
				},
				{
					name: "name_organisationname_fullname_multitext_ru",
					type: "STRING",
					comment: "",
				},
				{
					name: "name_organisationname_name_multitext_en",
					type: "STRING",
					comment: "",
				},
				{
					name: "name_organisationname_name_multitext_ru",
					type: "STRING",
					comment: "",
				},
				{
					name: "ownershiptyperef_dictionaryref_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "ownershiptyperef_dictionaryref_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "ownershiptyperef_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "ownershiptyperef_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "registrationcountry_countryalpha2",
					type: "STRING",
					comment: "",
				},
				{
					name: "businesscategoryentryref_dictionaryref_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "businesscategoryentryref_dictionaryref_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "businesscategoryentryref_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "businesscategoryentryref_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "smb",
					type: "STRING",
					comment: "",
				},
				{
					name: "sparkentityref_id_createtime",
					type: "STRING",
					comment: "",
				},
				{
					name: "sparkentityref_id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "sparkentityref_id_subsystemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "sparkentityref_id_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "sparkentityref_id_updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "sparkentityref_id_version",
					type: "STRING",
					comment: "",
				},
				{
					name: "status_legalentitylificyclestatusvalues",
					type: "STRING",
					comment: "",
				},
				{
					name: "urfu",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_createtime",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_subsystemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_system_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_version",
					type: "STRING",
					comment: "",
				},
				{
					name: "businesscategory_id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "industry_id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "legalform_id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "localinfo_vtborgid_id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "ownershiptype_id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "parentprofile_id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sparkid_id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "localinfo_investclass",
					type: "STRING",
					comment: "",
				},
				{
					name: "localinfo_localclienttype_corporateclientstatusvalues",
					type: "STRING",
					comment: "",
				},
				{
					name: "localinfo_organissubsidiaryref_dictionaryref_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "localinfo_organissubsidiaryref_dictionaryref_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "localinfo_organissubsidiaryref_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "localinfo_organissubsidiaryref_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "analyticalorganisationprofileref_id_createtime",
					type: "STRING",
					comment: "",
				},
				{
					name: "analyticalorganisationprofileref_id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "analyticalorganisationprofileref_id_subsystemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "analyticalorganisationprofileref_id_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "analyticalorganisationprofileref_id_updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "analyticalorganisationprofileref_id_version",
					type: "STRING",
					comment: "",
				},
				{
					name: "profileenitytype_organisationbusinessentitytypevalues",
					type: "STRING",
					comment: "",
				},
				{
					name: "profiletype_organisationprofiletypevalues",
					type: "STRING",
					comment: "",
				},
				{
					name: "subsidiaryprofilesmarket_hash",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "dte",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_repl_subo_csep/csep_dictionary_organisationprofileclientindustrydictionary",
			modified: false,
			type: "table",
			namespace: "prod_repl_subo_csep",
			name: "csep_dictionary_organisationprofileclientindustrydictionary",
			attrSeq: [
				{
					name: "commit_ts",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "op_seq",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "op_scn",
					type: "STRING",
					comment: "",
				},
				{
					name: "processed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "id",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationprofiledictionaryentry_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationprofiledictionaryentry_parentid",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationprofiledictionaryentry_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "dte",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_repl_subo_csep/csep_analytical_localinfo_organisation_localparams",
			modified: false,
			type: "table",
			namespace: "prod_repl_subo_csep",
			name: "csep_analytical_localinfo_organisation_localparams",
			attrSeq: [
				{
					name: "commit_ts",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "op_seq",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_scn",
					type: "STRING",
					comment: "",
				},
				{
					name: "processed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "parametertypeentry_dictionary_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "parametertypeentry_dictionary_system_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "parametertypeentry_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "parametertypeentry_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "value",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_createtime",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_subsystemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_system_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_version",
					type: "STRING",
					comment: "",
				},
				{
					name: "code_id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "object_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "parent_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "dte",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_repl_subo_csep/csep_dictionary_localanalyticalparametertype",
			modified: false,
			type: "table",
			namespace: "prod_repl_subo_csep",
			name: "csep_dictionary_localanalyticalparametertype",
			attrSeq: [
				{
					name: "commit_ts",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "op_seq",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "op_scn",
					type: "STRING",
					comment: "",
				},
				{
					name: "processed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "id",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationprofiledictionaryentry_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationprofiledictionaryentry_parentid",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationprofiledictionaryentry_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "dte",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_repl_subo_csep/csep_organisationprofilesegmentassignment_segments",
			modified: false,
			type: "table",
			namespace: "prod_repl_subo_csep",
			name: "csep_organisationprofilesegmentassignment_segments",
			attrSeq: [
				{
					name: "commit_ts",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "op_scn",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_seq",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "processed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "parent_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "object_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "businesscategory_id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "from",
					type: "STRING",
					comment: "",
				},
				{
					name: "profileclientsegmentref_dictionary_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "profileclientsegmentref_dictionary_system",
					type: "STRING",
					comment: "",
				},
				{
					name: "profileclientsegmentref_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "profileclientsegmentref_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_createtime",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_subsystem",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_system",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_version",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "dte",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_repl_subo_csep/csep_dictionary_organisationprofilebusinesscategorydictionary",
			modified: false,
			type: "table",
			namespace: "prod_repl_subo_csep",
			name: "csep_dictionary_organisationprofilebusinesscategorydictionary",
			attrSeq: [
				{
					name: "commit_ts",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "op_seq",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "op_scn",
					type: "STRING",
					comment: "",
				},
				{
					name: "processed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "id",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationprofiledictionaryentry_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationprofiledictionaryentry_parentid",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationprofiledictionaryentry_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "dte",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_repl_subo_csfg/csfg_business_unit",
			modified: false,
			type: "table",
			namespace: "prod_repl_subo_csfg",
			name: "csfg_business_unit",
			attrSeq: [
				{
					name: "changeid",
					type: "STRING",
					comment: "",
				},
				{
					name: "changetype",
					type: "STRING",
					comment: "",
				},
				{
					name: "changetimestamp",
					type: "STRING",
					comment: "",
				},
				{
					name: "level",
					type: "STRING",
					comment: "",
				},
				{
					name: "sourcesystem",
					type: "STRING",
					comment: "",
				},
				{
					name: "type_dictionary_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "type_dictionary_system",
					type: "STRING",
					comment: "",
				},
				{
					name: "type_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "type_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "head_id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "head_id_system",
					type: "STRING",
					comment: "",
				},
				{
					name: "head_id_subsystem",
					type: "STRING",
					comment: "",
				},
				{
					name: "head_id_version",
					type: "STRING",
					comment: "",
				},
				{
					name: "head_id_updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "head_id_createtime",
					type: "STRING",
					comment: "",
				},
				{
					name: "headsubstitute_id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "headsubstitute_id_system",
					type: "STRING",
					comment: "",
				},
				{
					name: "headsubstitute_id_subsystem",
					type: "STRING",
					comment: "",
				},
				{
					name: "headsubstitute_id_version",
					type: "STRING",
					comment: "",
				},
				{
					name: "headsubstitute_id_updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "headsubstitute_id_createtime",
					type: "STRING",
					comment: "",
				},
				{
					name: "category_dictionary_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "category_dictionary_system",
					type: "STRING",
					comment: "",
				},
				{
					name: "category_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "category_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "name",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationunit_dictionary_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationunit_dictionary_system",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationunit_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "organisationunit_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "shortname",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_system",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_subsystem",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_version",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_createtime",
					type: "STRING",
					comment: "",
				},
				{
					name: "record_hash",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
			],
		},
		{
			id: "prod_repl_shcm/orgunitadrinfo",
			modified: false,
			type: "table",
			namespace: "prod_repl_shcm",
			name: "orgunitadrinfo",
			attrSeq: [
				{
					name: "ou_id",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "begda",
					type: "STRING",
					comment: "",
				},
				{
					name: "endda",
					type: "STRING",
					comment: "",
				},
				{
					name: "kregio",
					type: "STRING",
					comment: "",
				},
				{
					name: "regionname",
					type: "STRING",
					comment: "",
				},
				{
					name: "regionsocr",
					type: "STRING",
					comment: "",
				},
				{
					name: "kindex",
					type: "STRING",
					comment: "",
				},
				{
					name: "areaname",
					type: "STRING",
					comment: "",
				},
				{
					name: "areasocr",
					type: "STRING",
					comment: "",
				},
				{
					name: "kname_city",
					type: "STRING",
					comment: "",
				},
				{
					name: "ksocr_city",
					type: "STRING",
					comment: "",
				},
				{
					name: "kname_np",
					type: "STRING",
					comment: "",
				},
				{
					name: "ksocr_np",
					type: "STRING",
					comment: "",
				},
				{
					name: "planname",
					type: "STRING",
					comment: "",
				},
				{
					name: "kname_street",
					type: "STRING",
					comment: "",
				},
				{
					name: "ksocr_street",
					type: "STRING",
					comment: "",
				},
				{
					name: "kname_house",
					type: "STRING",
					comment: "",
				},
				{
					name: "kname_bldng",
					type: "STRING",
					comment: "",
				},
				{
					name: "strucnum",
					type: "STRING",
					comment: "",
				},
				{
					name: "file_source",
					type: "STRING",
					comment: "",
				},
				{
					name: "effective_from_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "effective_to_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
			],
		},
		{
			id: "prod_repl_ods_acpd/h2_c_dadm_de_c_s_cl_pr_u",
			modified: false,
			type: "view",
			namespace: "prod_repl_ods_acpd",
			name: "h2_c_dadm_de_c_s_cl_pr_u",
			attrSeq: [
				{
					name: "start_date",
					type: "STRING",
					comment: "",
				},
				{
					name: "deleted_ind",
					type: "STRING",
					comment: "",
				},
				{
					name: "odsprocessed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "last_rowid_system",
					type: "STRING",
					comment: "",
				},
				{
					name: "key_1",
					type: "STRING",
					comment: "",
				},
				{
					name: "odseffective_from_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "odscreate_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "odseffective_from_csn",
					type: "STRING",
					comment: "",
				},
				{
					name: "shor_spr_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "odsupdate_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "interaction_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "creator",
					type: "STRING",
					comment: "",
				},
				{
					name: "comment_1",
					type: "STRING",
					comment: "",
				},
				{
					name: "value",
					type: "STRING",
					comment: "",
				},
				{
					name: "rowid_object",
					type: "STRING",
					comment: "",
				},
				{
					name: "odseffective_to_csn",
					type: "STRING",
					comment: "",
				},
				{
					name: "tabl_name_use_spr",
					type: "STRING",
					comment: "",
				},
				{
					name: "consolidation_ind",
					type: "STRING",
					comment: "",
				},
				{
					name: "odsdeleted_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "dirty_ind",
					type: "STRING",
					comment: "",
				},
				{
					name: "updated_by",
					type: "STRING",
					comment: "",
				},
				{
					name: "id",
					type: "STRING",
					comment: "",
				},
				{
					name: "create_date",
					type: "STRING",
					comment: "",
				},
				{
					name: "hub_state_ind",
					type: "STRING",
					comment: "",
				},
				{
					name: "hub_stte_ind",
					type: "STRING",
					comment: "",
				},
				{
					name: "odseffective_to_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "end_date",
					type: "STRING",
					comment: "",
				},
				{
					name: "odsis_active_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "last_update_date",
					type: "STRING",
					comment: "",
				},
				{
					name: "deleted_date",
					type: "STRING",
					comment: "",
				},
				{
					name: "deleted_by",
					type: "STRING",
					comment: "",
				},
				{
					name: "cm_dirty_ind",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "partition_month_odseffective_to_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "partition_month_odseffective_from_dt",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_repl_subo_csep/csep_assigmentservice_teams",
			modified: false,
			type: "table",
			namespace: "prod_repl_subo_csep",
			name: "csep_assigmentservice_teams",
			attrSeq: [
				{
					name: "commit_ts",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "op_seq",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_scn",
					type: "STRING",
					comment: "",
				},
				{
					name: "processed_dt",
					type: "STRING",
					comment: "",
				},
				{
					name: "op_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_createtime",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_subsystemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_version",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_organisationunit_id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "id_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "object_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "parent_guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_clienttype_corporateclientstatustypevalues",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_organisationunitref_dictionaryref_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_organisationunitref_dictionaryref_syscode",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_csfgbusinessunitref_id_createtime",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_csfgbusinessunitref_id_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_csfgbusinessunitref_id_subsystemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_csfgbusinessunitref_id_systemcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_csfgbusinessunitref_id_updatetime",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_csfgbusinessunitref_id_version",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_organisationunitref_key",
					type: "STRING",
					comment: "",
				},
				{
					name: "department_organisationunitref_keyname",
					type: "STRING",
					comment: "",
				},
				{
					name: "type_assignmenttypevalues",
					type: "STRING",
					comment: "",
				},
				{
					name: "teams_hash",
					type: "STRING",
					comment: "",
				},
				{
					name: "managers_hash",
					type: "STRING",
					comment: "",
				},
				{
					name: "products_hash",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "dte",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_kih_full_export/e46_ref_subject_h_f_v",
			modified: false,
			type: "view",
			namespace: "prod_kih_full_export",
			name: "e46_ref_subject_h_f_v",
			attrSeq: [
				{
					name: "sbjh_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_start_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "sbjh_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "sbjh_row_status",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_audit_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_hash",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_name_eng",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_short_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_last_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_first_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_patronymic_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_client_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_client_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_resident_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_client_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_client_subtype_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_okopf_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_okved",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_okved_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_okonh",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_okonh_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_ogrn",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_okpo",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_kpp",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_okfs_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_okato_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_okogu",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "sbjh_clgrp_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_sex_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_birth_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "sbjh_birth_place",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_job_place",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_job_title",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_user_id_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_user_id_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_pension_fund_reg_nmb",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_sec_market_licence_nmb",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_business_size_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_borrower_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_rg_cntry_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_rg_city",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_rg_address",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_rg_postal_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_lc_cntry_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_lc_city",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_lc_address",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_lc_postal_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_director_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_accountant_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_bnk_swift_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_bnk_bic",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_bnk_license_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_bnk_license_valid_from",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "sbjh_bnk_license_valid_till",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "sbjh_bnk_bank_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_bnk_kgrko_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_bnk_swift_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_ownership_capital_amnt",
					type: "DECIMAL(38,11)",
					comment: "",
				},
				{
					name: "sbjh_kio",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_score_value",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "sbjh_credit_rtng_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_industry_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_opf_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_reference",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_subject_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_financial_rating_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_bankruptcy_stage_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_exec_auth_level_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_exec_auth_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_interbnk_sect_cl_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_bank_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_lending_agency_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_serv_by_treasuer_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_exec_auth_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_manage_bud_funds_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_financial_org_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_ownrsh_capital_crnc_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_offshore_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_kgrko_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_bnk_bic_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_swift_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_bnk_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_cstm_client_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_cstm_client_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_nat_monopoly_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_egrul_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_phone_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_region_lc_okato_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_region_reg_okato_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_ogrn_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "sbjh_ogrn_place",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_bank_relation_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_parent_company_clnt_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_otrsl_rsbu_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_business_size_cs_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_fund_particip_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_fatca_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_fatca_abs_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_fatca_tax_payer_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_fatca_giin",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_fatca_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_fatca_fi_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_source_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_source",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_is_ofi_8966_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_crm_industry",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_crm_frontoffice",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_dataset_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_parent_sbj_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_src_change_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "sbjh_ownership_capital_part",
					type: "DECIMAL(38,2)",
					comment: "",
				},
				{
					name: "sbjh_fatca_control_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "sbjh_urfu_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "sbjh_user_id_issue_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "sbjh_citizenship_cntry_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "partition_sbjh_start_date",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_kih_full_export/e46_ref_client_union_h_f_v",
			modified: false,
			type: "view",
			namespace: "prod_kih_full_export",
			name: "e46_ref_client_union_h_f_v",
			attrSeq: [
				{
					name: "clntuh_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_start_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clntuh_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clntuh_row_status",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_audit_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_hash",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_name_eng",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_short_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_last_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_first_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_patronymic_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_client_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_client_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_resident_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_client_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_client_subtype_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_okopf_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_okved",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_okved_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_okonh",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_okonh_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_ogrn",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_okpo",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_kpp",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_okfs_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_okato_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_okogu",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "clntuh_clgrp_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_sex_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_birth_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clntuh_birth_place",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_job_place",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_job_title",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_user_id_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_user_id_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_pension_fund_reg_nmb",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_sec_market_licence_nmb",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_business_size_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_borrower_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_rg_cntry_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_rg_city",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_rg_address",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_rg_postal_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_lc_cntry_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_lc_city",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_lc_address",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_lc_postal_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_director_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_accountant_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_service_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_supervise_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bud_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_supervise_empl_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_abs",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_sl",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_branch_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bnk_swift_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bnk_bic",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bnk_license_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bnk_license_valid_from",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clntuh_bnk_license_valid_till",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clntuh_bnk_bank_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bnk_kgrko_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bnk_swift_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_sbj_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_score_value",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "clntuh_credit_rtng_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_industry_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_opf_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_ownership_capital_amnt",
					type: "DECIMAL(38,11)",
					comment: "",
				},
				{
					name: "clntuh_kio",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_reference",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_subject_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_financial_rating_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bankruptcy_stage_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_emitent_rtng_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_employee_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_empl_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_exec_auth_level_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_exec_auth_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_interbnk_sect_cl_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_bank_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_lending_agency_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_serv_by_treasuer_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_exec_auth_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_manage_bud_funds_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_financial_org_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_department_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_ownrsh_capital_crnc_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_is_offshore_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_kgrko_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bnk_bic_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_swift_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bnk_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_cstm_client_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_cstm_client_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_nat_monopoly_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_egrul_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_phone_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_region_lc_okato_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_region_reg_okato_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_ogrn_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clntuh_ogrn_place",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_parent_company_clnt_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_slx_dept",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_otrsl_rsbu_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_bank_relation_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clntuh_business_size_cs_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "partition_clntuh_end_date",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_kih_full_export/e46_ref_client_h_f_v",
			modified: false,
			type: "view",
			namespace: "prod_kih_full_export",
			name: "e46_ref_client_h_f_v",
			attrSeq: [
				{
					name: "clnth_okogu",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "clnth_score_value",
					type: "DECIMAL(38,0)",
					comment: "",
				},
				{
					name: "clnth_ownership_capital_amnt",
					type: "DECIMAL(38,1)",
					comment: "",
				},
				{
					name: "clnth_credit_rtng_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_egrul_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_phone_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_okopf_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bnk_swift_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bnk_bic",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_opf_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_okonh",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_birth_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_is_serv_by_treasuer_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bnk_kgrko_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_job_place",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_exec_auth_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_audit_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_business_size_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_business_size_cs_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_otrsl_rsbu_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_sl",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_lc_address",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_src_service_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_client_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_ownrsh_capital_crnc_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_user_id_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_rg_city",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_ogrn_place",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_patronymic_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_rg_postal_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_cstm_client_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_client_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bnk_license_valid_from",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_kgrko_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_msp_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_reg_department_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_svod_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_department_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_sec_market_licence_nmb",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_resident_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_reference",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_src_create_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_src_branch_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_clntu_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_sex_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_product_upr_direction",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_supervise_empl_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_lc_postal_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_lending_agency_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_msp_reg_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_okved_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bank_relation_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_financial_rating_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bnk_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_rg_cntry_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bankruptcy_stage_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_job_title",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_service_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_okato_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_name_eng",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_parent_company_clnt_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bud_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_src_close_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_ogrn_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_hash",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_industry_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_bank_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_borrower_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_interbnk_sect_cl_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_pension_fund_reg_nmb",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_swift_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_source",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_clgrp_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_fund_particip_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_lc_cntry_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bnk_bic_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_supervise_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_exec_auth_level_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_union_clntu_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_ogrn",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bnk_bank_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_short_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_kio",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_ads_source_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_fatca_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_employee_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_branch_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_accountant_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_exec_auth_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_start_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_client_subtype_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_sbj_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_last_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_lc_city",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_client_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_product_is_approved_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bnk_swift_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_region_lc_okato_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_offshore_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_product_sector",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bnk_license_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_industry_corp_block",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_product_service",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_first_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_okfs_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_exclude_180_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_okved",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_user_id_issue_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_is_financial_org_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_slx_dept",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_empl_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_tin",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_user_id_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_cstm_client_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_product_employee_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_birth_place",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_okonh_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_region_reg_okato_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_kpp",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_abs",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_okpo",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_rg_address",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_bnk_license_valid_till",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "clnth_emitent_rtng_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_nat_monopoly_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_director_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_product_portfolio",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_is_manage_bud_funds_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_subject_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_row_status",
					type: "STRING",
					comment: "",
				},
				{
					name: "clnth_eid",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "partition_clnth_end_date",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_kih_full_export/e46_ref_account_h_f_v",
			modified: false,
			type: "view",
			namespace: "prod_kih_full_export",
			name: "e46_ref_account_h_f_v",
			attrSeq: [
				{
					name: "acnth_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_start_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_change_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_row_status",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_audit_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_hash",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_clnt_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_crnc_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_bacnt_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_account_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_account_function_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_is_technical_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_open_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_close_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_open_notification_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_close_notification_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_account_status_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_balance_num",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_balance_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_symbol",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_nostro_number",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_nostro_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_sec_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_dacnt_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_dpos_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_rate_percent_basis_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_rate_float_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_rate_revision_note",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_rate_fixed_amount",
					type: "DECIMAL(38,15)",
					comment: "",
				},
				{
					name: "acnth_rate_tax_amount",
					type: "DECIMAL(38,5)",
					comment: "",
				},
				{
					name: "acnth_rate_reval_period",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_service_empl_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_service_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_branch_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_is_confedential_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_abstract_policy",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_active_quality_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_active_res_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_asset_callback_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_description",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_acnt_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_reserve_rate",
					type: "DECIMAL(38,15)",
					comment: "",
				},
				{
					name: "acnth_remote_access_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_internet_access_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_mobile_access_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_opu_symbol_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_using_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_share_rate",
					type: "DECIMAL(38,15)",
					comment: "",
				},
				{
					name: "acnth_basis_crnc_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_beneficiary_clnt_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_opu_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_opu7_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_garnishment_of_acnt_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_acnt_budget_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_deal_begin_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_deal_end_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_parent_acnt_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_is_svod_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_svod_desc",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_is_garant_key_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_exclude_345_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_oper_begin_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_oper_close_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "acnth_service_detail_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_base_amount",
					type: "DECIMAL(38,5)",
					comment: "",
				},
				{
					name: "acnth_account_subtype_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_mask_account_type_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_sing_of_change_rates_flg",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_account_function_fts_cd",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_source",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_source_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_stock_br_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_stock_dept_gid",
					type: "STRING",
					comment: "",
				},
				{
					name: "acnth_stock_point_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "partition_acnth_end_date",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
			],
		},
		{
			id: "prod_repl_ceh/active_client_hist",
			modified: false,
			type: "table",
			namespace: "prod_repl_ceh",
			name: "active_client_hist",
			attrSeq: [
				{
					name: "client_rk",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "corp_roo_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "effective_from_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "effective_to_date",
					type: "TIMESTAMP",
					comment: "",
				},
				{
					name: "bis_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "client_slx_id",
					type: "STRING",
					comment: "",
				},
				{
					name: "upr_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "subsegment_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "reason_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "ved_flg",
					type: "BOOLEAN",
					comment: "",
				},
				{
					name: "reg_flg",
					type: "BOOLEAN",
					comment: "",
				},
				{
					name: "inn_num",
					type: "STRING",
					comment: "",
				},
				{
					name: "deleted_flg",
					type: "BOOLEAN",
					comment: "",
				},
				{
					name: "version_id",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "record_hash",
					type: "STRING",
					comment: "",
				},
				{
					name: "hdp_processed_dttm",
					type: "TIMESTAMP",
					comment: "",
				},
			],
		},
		{
			id: "prod_external_spark/spark_companyhistoryreport_main",
			modified: false,
			type: "table",
			namespace: "prod_external_spark",
			name: "spark_companyhistoryreport_main",
			attrSeq: [
				{
					name: "sparkid",
					type: "STRING",
					comment: "",
				},
				{
					name: "companytype",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "status_isacting",
					type: "INT",
					comment: "",
				},
				{
					name: "status_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "status_type",
					type: "STRING",
					comment: "",
				},
				{
					name: "status_groupid",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "status_groupname",
					type: "STRING",
					comment: "",
				},
				{
					name: "status_date",
					type: "STRING",
					comment: "",
				},
				{
					name: "egrpoincluded",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "egrullikvidation",
					type: "STRING",
					comment: "",
				},
				{
					name: "isacting",
					type: "INT",
					comment: "",
				},
				{
					name: "datefirstreg",
					type: "STRING",
					comment: "",
				},
				{
					name: "shortnamerus",
					type: "STRING",
					comment: "",
				},
				{
					name: "shortnameen",
					type: "STRING",
					comment: "",
				},
				{
					name: "fullnamerus",
					type: "STRING",
					comment: "",
				},
				{
					name: "normname",
					type: "STRING",
					comment: "",
				},
				{
					name: "guid",
					type: "STRING",
					comment: "",
				},
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "kpp",
					type: "STRING",
					comment: "",
				},
				{
					name: "ogrn",
					type: "STRING",
					comment: "",
				},
				{
					name: "okpo",
					type: "STRING",
					comment: "",
				},
				{
					name: "bik",
					type: "STRING",
					comment: "",
				},
				{
					name: "fcsmcode",
					type: "STRING",
					comment: "",
				},
				{
					name: "rts",
					type: "STRING",
					comment: "",
				},
				{
					name: "okato_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "okato_regionname",
					type: "STRING",
					comment: "",
				},
				{
					name: "okato_regioncode",
					type: "STRING",
					comment: "",
				},
				{
					name: "oktmo_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "okogu_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "okogu_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "okfs_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "okfs_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "okopf_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "okopf_codenew",
					type: "STRING",
					comment: "",
				},
				{
					name: "okopf_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "chartercapital",
					type: "DOUBLE",
					comment: "",
				},
				{
					name: "email",
					type: "STRING",
					comment: "",
				},
				{
					name: "www",
					type: "STRING",
					comment: "",
				},
				{
					name: "workersrange",
					type: "STRING",
					comment: "",
				},
				{
					name: "index",
					type: "STRING",
					comment: "",
				},
				{
					name: "indexdesc",
					type: "STRING",
					comment: "",
				},
				{
					name: "failurescorevalue",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "failurescoredesc",
					type: "STRING",
					comment: "",
				},
				{
					name: "paymentindexvalue",
					type: "STRING",
					comment: "",
				},
				{
					name: "paymentindexdesc",
					type: "STRING",
					comment: "",
				},
				{
					name: "creditlimit_value",
					type: "DOUBLE",
					comment: "",
				},
				{
					name: "creditlimit_description",
					type: "STRING",
					comment: "",
				},
				{
					name: "companysize_revenue",
					type: "DOUBLE",
					comment: "",
				},
				{
					name: "companysize_description",
					type: "STRING",
					comment: "",
				},
				{
					name: "companysize_actualdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistration_regdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistration_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistration_regauthorityaddress",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistration_regauthoritycode",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationcurrent_regdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationcurrent_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationcurrent_regauthorityaddress",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationcurrent_regauthoritycode",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationpayment_regdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationpayment_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationpayment_regauthorityaddress",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationpayment_regauthoritycode",
					type: "STRING",
					comment: "",
				},
				{
					name: "registernumber",
					type: "STRING",
					comment: "",
				},
				{
					name: "pensionfund_registrationdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "pensionfund_deregistrationdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "pensionfund_registernumber",
					type: "STRING",
					comment: "",
				},
				{
					name: "pensionfund_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "socialinsurancefund_registrationdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "socialinsurancefund_deregistrationdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "socialinsurancefund_registernumber",
					type: "STRING",
					comment: "",
				},
				{
					name: "socialinsurancefund_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "compulsorymedicalinsurancefund_registrationdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "compulsorymedicalinsurancefund_deregistrationdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "compulsorymedicalinsurancefund_registernumber",
					type: "STRING",
					comment: "",
				},
				{
					name: "compulsorymedicalinsurancefund_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "countcoownerfcsm",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "countcoownerrosstat",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "countcoowneregrul",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "countbranch",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "countbranchrosstat",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "countbranchegrul",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "countaffiliatedcompanyfcsm",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "countaffiliatedcompanyrosstat",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "countaffiliatedcompanyegrul",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "nonprofitorganizationrosstat",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "telephonecount",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "phonecode",
					type: "STRING",
					comment: "",
				},
				{
					name: "phonenumber",
					type: "STRING",
					comment: "",
				},
				{
					name: "companywithsameinfo_addresscount",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "companywithsameinfo_addresswithoutroomcount",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "addressnotaffiliatedcount",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "addressftscount",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "managercountincountry",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "managercountinregion",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "managerinncount",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "companyliquidatedwithsameinfo_addresscount",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "companyliquidatedwithsameinfo_addresswithoutroomcount",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "executionproceedings_active",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "executionproceedings_executed",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "pledger_active",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "pledger_ceased",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "pledgee_active",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "pledgee_ceased",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "date_from",
					type: "STRING",
					comment: "",
				},
				{
					name: "date_to",
					type: "STRING",
					comment: "",
				},
				{
					name: "accreditation_nza",
					type: "STRING",
					comment: "",
				},
				{
					name: "accreditation_startdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "accreditation_enddate",
					type: "STRING",
					comment: "",
				},
				{
					name: "chartercapital_actualdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "tosp",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "prod_external_spark/spark_entrepreneurshortreport_main",
			modified: false,
			type: "table",
			namespace: "prod_external_spark",
			name: "spark_entrepreneurshortreport_main",
			attrSeq: [
				{
					name: "sparkid",
					type: "STRING",
					comment: "",
				},
				{
					name: "status_isacting",
					type: "INT",
					comment: "",
				},
				{
					name: "status_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "status_text",
					type: "STRING",
					comment: "",
				},
				{
					name: "status_groupid",
					type: "INT",
					comment: "",
				},
				{
					name: "status_groupname",
					type: "STRING",
					comment: "",
				},
				{
					name: "status_date",
					type: "STRING",
					comment: "",
				},
				{
					name: "datefirstreg",
					type: "STRING",
					comment: "",
				},
				{
					name: "datereg",
					type: "STRING",
					comment: "",
				},
				{
					name: "fullnamerus",
					type: "STRING",
					comment: "",
				},
				{
					name: "inn",
					type: "STRING",
					comment: "",
				},
				{
					name: "ogrnip",
					type: "STRING",
					comment: "",
				},
				{
					name: "okpo",
					type: "STRING",
					comment: "",
				},
				{
					name: "okato_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "okato_regionname",
					type: "STRING",
					comment: "",
				},
				{
					name: "okato_regioncode",
					type: "STRING",
					comment: "",
				},
				{
					name: "oktmo_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "okopf_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "okopf_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "paymentindexvalue",
					type: "STRING",
					comment: "",
				},
				{
					name: "paymentindexdesc",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistration_regdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistration_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistration_regauthorityaddress",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistration_regauthoritycode",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationcurrent_regdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationcurrent_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationcurrent_regauthorityaddress",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationcurrent_regauthoritycode",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationpayment_regdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationpayment_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationpayment_regauthorityaddress",
					type: "STRING",
					comment: "",
				},
				{
					name: "federaltaxregistrationpayment_regauthoritycode",
					type: "STRING",
					comment: "",
				},
				{
					name: "pensionfund_registrationdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "pensionfund_registernumber",
					type: "STRING",
					comment: "",
				},
				{
					name: "pensionfund_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "socialinsurancefund_registrationdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "socialinsurancefund_registernumber",
					type: "STRING",
					comment: "",
				},
				{
					name: "socialinsurancefund_regauthority",
					type: "STRING",
					comment: "",
				},
				{
					name: "birthdate",
					type: "STRING",
					comment: "",
				},
				{
					name: "birthplace",
					type: "STRING",
					comment: "",
				},
				{
					name: "sex_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "sex_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "citizenship_code",
					type: "STRING",
					comment: "",
				},
				{
					name: "citizenship_name",
					type: "STRING",
					comment: "",
				},
				{
					name: "executionproceedings_active",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "executionproceedings_executed",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "pledger_active",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "pledger_ceased",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "pledgee_active",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "pledgee_ceased",
					type: "BIGINT",
					comment: "",
				},
				{
					name: "date_from",
					type: "STRING",
					comment: "",
				},
				{
					name: "date_to",
					type: "STRING",
					comment: "",
				},
			],
		},
		{
			id: "ru.vtb.uopd.mlistener.Unmatched",
			modified: false,
			type: "unresolved",
			namespace: "",
			name: "ru.vtb.uopd.mlistener.Unmatched",
			attrSeq: [],
		},
		{
			id: "org.apache.spark.rdd.MapPartitionsRDD/null",
			modified: false,
			type: "rdd",
			namespace: "org.apache.spark.rdd.MapPartitionsRDD",
			name: null,
			attrSeq: [
				{
					name: "len_inn",
					type: "INT",
					comment: "",
				},
				{
					name: "num",
					type: "INT",
					comment: "",
				},
				{
					name: "constanta_inn",
					type: "INT",
					comment: "",
				},
			],
		},
		{
			id: "org.apache.spark.rdd.MapPartitionsRDD/null",
			modified: false,
			type: "rdd",
			namespace: "org.apache.spark.rdd.MapPartitionsRDD",
			name: null,
			attrSeq: [
				{
					name: "process_dttm",
					type: "STRING",
					comment: "",
				},
				{
					name: "status",
					type: "STRING",
					comment: "",
				},
				{
					name: "description",
					type: "STRING",
					comment: "",
				},
			],
		},
	],
	mappings: [
		{
			id: 0,
			entityId: "prod_dm_dadm_corp_wide/tmp_analitical",
			deps: [
				{
					entityId: "prod_repl_subo_csep/csep_analytical",
					attrMaps: [
						{
							src: "name_organisationname_name_multitext_ru",
							dst: "gsl_name",
						},
						{
							src: "cib",
							dst: "gbl",
						},
						{
							src: "name_organisationname_fullname_multitext_ru",
							dst: "org_nm",
						},
						{
							src: "processed_dt",
							dst: "processed_dt",
						},
						{
							src: "profileclientindustryentryref_key",
							dst: "industry_id",
						},
						{
							src: "id_id",
							dst: "gsl_slxid",
						},
						{
							src: "smb",
							dst: "gbl",
						},
						{
							src: "id_id",
							dst: "slxid",
						},
						{
							src: "urfu",
							dst: "gbl",
						},
					],
					atrDeps: [
						{
							attr: "analyticalorganisationprofileref_id_id",
							linkTypes: ["join"],
						},
						{
							attr: "id_id",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
						{
							attr: "op_scn",
							linkTypes: ["window", "where"],
						},
						{
							attr: "commit_ts",
							linkTypes: ["window", "where"],
						},
						{
							attr: "profileclientindustryentryref_key",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId:
						"prod_repl_subo_csep/csep_dictionary_organisationprofileclientindustrydictionary",
					attrMaps: [
						{
							src: "organisationprofiledictionaryentry_name",
							dst: "industry_name",
						},
					],
					atrDeps: [
						{
							attr: "organisationprofiledictionaryentry_parentid",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
					],
				},
			],
		},
		{
			id: 1,
			entityId: "prod_dm_dadm_corp_wide/tmp_local",
			deps: [
				{
					entityId:
						"prod_repl_subo_csep/csep_analytical_localinfo_organisation_localparams",
					attrMaps: [
						{
							src: "id_id",
							dst: "slxid",
						},
						{
							src: "processed_dt",
							dst: "processed_dt",
						},
						{
							src: "parametertypeentry_key",
							dst: "parametertypeentry_key",
						},
					],
					atrDeps: [
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
						{
							attr: "op_scn",
							linkTypes: ["window", "where"],
						},
						{
							attr: "id_id",
							linkTypes: ["window", "where"],
						},
						{
							attr: "parametertypeentry_key",
							linkTypes: ["join"],
						},
						{
							attr: "commit_ts",
							linkTypes: ["window", "where"],
						},
					],
				},
				{
					entityId:
						"prod_repl_subo_csep/csep_dictionary_localanalyticalparametertype",
					attrMaps: [
						{
							src: "organisationprofiledictionaryentry_name",
							dst: "problem_flag",
						},
					],
					atrDeps: [
						{
							attr: "op_scn",
							linkTypes: ["window", "where"],
						},
						{
							attr: "commit_ts",
							linkTypes: ["window", "where"],
						},
						{
							attr: "organisationprofiledictionaryentry_parentid",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
					],
				},
			],
		},
		{
			id: 2,
			entityId: "prod_dm_dadm_corp_wide/tmp_segment",
			deps: [
				{
					entityId:
						"prod_repl_subo_csep/csep_organisationprofilesegmentassignment_segments",
					attrMaps: [
						{
							src: "id_id",
							dst: "slxid",
						},
						{
							src: "profileclientsegmentref_key",
							dst: "segment_id",
						},
					],
					atrDeps: [
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
						{
							attr: "updatetime",
							linkTypes: ["window", "where"],
						},
						{
							attr: "profileclientsegmentref_key",
							linkTypes: ["join"],
						},
						{
							attr: "id_id",
							linkTypes: ["window", "where"],
						},
						{
							attr: "from",
							linkTypes: ["window", "where"],
						},
					],
				},
				{
					entityId:
						"prod_repl_subo_csep/csep_dictionary_organisationprofilebusinesscategorydictionary",
					attrMaps: [
						{
							src: "organisationprofiledictionaryentry_name",
							dst: "segment_name",
						},
					],
					atrDeps: [
						{
							attr: "op_scn",
							linkTypes: ["window", "where"],
						},
						{
							attr: "commit_ts",
							linkTypes: ["window", "where"],
						},
						{
							attr: "organisationprofiledictionaryentry_parentid",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
					],
				},
			],
		},
		{
			id: 3,
			entityId: "prod_dm_dadm_corp_wide/tmp_sales_point",
			deps: [
				{
					entityId: "prod_repl_subo_csfg/csfg_business_unit",
					attrMaps: [
						{
							src: "id_id",
							dst: "id_id",
						},
						{
							src: "organisationunit_key",
							dst: "sales_point_id",
						},
						{
							src: "name",
							dst: "sales_point_name",
						},
					],
					atrDeps: [
						{
							attr: "type_key",
							linkTypes: ["where"],
						},
						{
							attr: "organisationunit_key",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_repl_shcm/orgunitadrinfo",
					attrMaps: [
						{
							src: "kregio",
							dst: "detailed_region_cd",
						},
					],
					atrDeps: [
						{
							attr: "effective_from_dttm",
							linkTypes: ["where"],
						},
						{
							attr: "effective_to_dttm",
							linkTypes: ["where"],
						},
						{
							attr: "kregio",
							linkTypes: ["join"],
						},
						{
							attr: "ou_id",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_repl_ods_acpd/h2_c_dadm_de_c_s_cl_pr_u",
					attrMaps: [
						{
							src: "key_1",
							dst: "region_name",
						},
						{
							src: "key_1",
							dst: "region_cd",
						},
						{
							src: "value",
							dst: "region_cd",
						},
						{
							src: "value",
							dst: "region_name",
						},
						{
							src: "key_1",
							dst: "detailed_region_name",
						},
						{
							src: "value",
							dst: "detailed_region_name",
						},
					],
					atrDeps: [
						{
							attr: "odsis_active_flg",
							linkTypes: ["where"],
						},
						{
							attr: "value",
							linkTypes: ["join"],
						},
						{
							attr: "tabl_name_use_spr",
							linkTypes: ["where"],
						},
						{
							attr: "shor_spr_name",
							linkTypes: ["where"],
						},
						{
							attr: "hub_stte_ind",
							linkTypes: ["where"],
						},
						{
							attr: "end_date",
							linkTypes: ["where"],
						},
						{
							attr: "key_1",
							linkTypes: ["join"],
						},
						{
							attr: "odseffective_to_dt",
							linkTypes: ["where"],
						},
						{
							attr: "id",
							linkTypes: ["groupby"],
						},
					],
				},
			],
		},
		{
			id: 4,
			entityId: "prod_dm_dadm_corp_wide/tmp_client_hist",
			deps: [
				{
					entityId: "prod_repl_subo_csep/csep_assigmentservice_teams",
					attrMaps: [
						{
							src: "department_clienttype_corporateclientstatustypevalues",
							dst: "client_type_id",
						},
					],
					atrDeps: [
						{
							attr: "id_id",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "department_clienttype_corporateclientstatustypevalues",
							linkTypes: ["window", "where"],
						},
						{
							attr: "department_organisationunitref_key",
							linkTypes: ["join"],
						},
						{
							attr: "department_organisationunitref_dictionaryref_id",
							linkTypes: ["where"],
						},
						{
							attr: "processed_dt",
							linkTypes: ["where"],
						},
						{
							attr: "type_assignmenttypevalues",
							linkTypes: ["where"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_analitical",
					attrMaps: [
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "processed_dt",
							dst: "processed_dt",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "report_date",
							dst: "report_date",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_segment",
					attrMaps: [
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_local",
					attrMaps: [
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_sales_point",
					attrMaps: [
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [
						{
							attr: "id_id",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 5,
			entityId: "prod_dm_dadm_corp_wide/tmp_cl_inn_inf",
			deps: [
				{
					entityId: "prod_kih_full_export/e46_ref_subject_h_f_v",
					attrMaps: [
						{
							src: "sbjh_inn",
							dst: "inn",
						},
						{
							src: "sbjh_inn",
							dst: "salt_num_inn",
						},
					],
					atrDeps: [
						{
							attr: "sbjh_id",
							linkTypes: ["window", "where"],
						},
						{
							attr: "sbjh_inn",
							linkTypes: ["where"],
						},
						{
							attr: "sbjh_start_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "sbjh_row_status",
							linkTypes: ["where"],
						},
						{
							attr: "sbjh_end_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "sbjh_source_id",
							linkTypes: ["window", "join", "where"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client_hist",
					attrMaps: [
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 6,
			entityId: "prod_dm_dadm_corp_wide/tmp_first_acc_date",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/int_data",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
					],
					atrDeps: [
						{
							attr: "first_acc_date",
							linkTypes: ["where"],
						},
						{
							attr: "report_date_part",
							linkTypes: ["where"],
						},
						{
							attr: "inn",
							linkTypes: ["groupby"],
						},
					],
				},
			],
		},
		{
			id: 7,
			entityId: "prod_dm_dadm_corp_wide/tmp_cl_look",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_cl_inn_inf",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "salt_num_inn",
							dst: "salt_num_inn",
						},
					],
					atrDeps: [
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_first_acc_date",
					attrMaps: [],
					atrDeps: [
						{
							attr: "first_acc_date",
							linkTypes: ["where"],
						},
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 8,
			entityId: "prod_dm_dadm_corp_wide/tmp_client_union",
			deps: [
				{
					entityId: "prod_kih_full_export/e46_ref_client_union_h_f_v",
					attrMaps: [
						{
							src: "clntuh_end_date",
							dst: "clntuh_end_date",
						},
						{
							src: "clntuh_inn",
							dst: "clntuh_inn",
						},
						{
							src: "clntuh_gid",
							dst: "clntuh_gid",
						},
						{
							src: "clntuh_inn",
							dst: "salt_num_inn_cl",
						},
						{
							src: "clntuh_start_date",
							dst: "clntuh_start_date",
						},
					],
					atrDeps: [
						{
							attr: "clntuh_end_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clntuh_row_status",
							linkTypes: ["where"],
						},
						{
							attr: "clntuh_gid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clntuh_start_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clntuh_inn",
							linkTypes: ["window", "join", "where"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_cl_look",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "salt_num_inn",
							dst: "salt_num_inn",
						},
					],
					atrDeps: [
						{
							attr: "salt_num_inn",
							linkTypes: ["join"],
						},
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 9,
			entityId: "prod_dm_dadm_corp_wide/tmp_client",
			deps: [
				{
					entityId: "prod_kih_full_export/e46_ref_client_h_f_v",
					attrMaps: [
						{
							src: "clnth_gid",
							dst: "clnth_gid",
						},
						{
							src: "clnth_union_clntu_gid",
							dst: "clnth_union_clntu_gid",
						},
						{
							src: "clnth_start_date",
							dst: "clnth_start_date",
						},
						{
							src: "clnth_end_date",
							dst: "clnth_end_date",
						},
					],
					atrDeps: [
						{
							attr: "clnth_row_status",
							linkTypes: ["where"],
						},
						{
							attr: "clnth_gid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clnth_end_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clnth_union_clntu_gid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clnth_start_date",
							linkTypes: ["window", "where"],
						},
					],
				},
			],
		},
		{
			id: 10,
			entityId: "prod_dm_dadm_corp_wide/tmp_client_join",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client",
					attrMaps: [
						{
							src: "clnth_gid",
							dst: "clnth_gid",
						},
					],
					atrDeps: [
						{
							attr: "clnth_gid",
							linkTypes: ["groupby"],
						},
						{
							attr: "clnth_union_clntu_gid",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client_union",
					attrMaps: [],
					atrDeps: [
						{
							attr: "clntuh_gid",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 11,
			entityId: "prod_dm_dadm_corp_wide/tmp_account",
			deps: [
				{
					entityId: "prod_kih_full_export/e46_ref_account_h_f_v",
					attrMaps: [
						{
							src: "acnth_end_date",
							dst: "acnth_end_date",
						},
						{
							src: "acnth_clnt_gid",
							dst: "acnth_clnt_gid",
						},
						{
							src: "acnth_open_date",
							dst: "acnth_open_date",
						},
						{
							src: "acnth_start_date",
							dst: "acnth_start_date",
						},
						{
							src: "acnth_gid",
							dst: "acnth_gid",
						},
					],
					atrDeps: [
						{
							attr: "acnth_clnt_gid",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "acnth_start_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "acnth_end_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "acnth_gid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "acnth_row_status",
							linkTypes: ["where"],
						},
						{
							attr: "acnth_open_date",
							linkTypes: ["where"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client_join",
					attrMaps: [
						{
							src: "count",
							dst: "count",
						},
					],
					atrDeps: [
						{
							attr: "clnth_gid",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 12,
			entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step1",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_cl_look",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
					],
					atrDeps: [
						{
							attr: "salt_num_inn",
							linkTypes: ["join"],
						},
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client_union",
					attrMaps: [
						{
							src: "clntuh_gid",
							dst: "clntuh_gid",
						},
						{
							src: "clntuh_start_date",
							dst: "clntuh_start_date",
						},
						{
							src: "clntuh_end_date",
							dst: "clntuh_end_date",
						},
					],
					atrDeps: [
						{
							attr: "salt_num_inn_cl",
							linkTypes: ["join"],
						},
						{
							attr: "clntuh_inn",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 13,
			entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step2",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step1",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "clntuh_gid",
							dst: "clntuh_gid",
						},
						{
							src: "clntuh_start_date",
							dst: "clntuh_start_date",
						},
						{
							src: "clntuh_end_date",
							dst: "clntuh_end_date",
						},
					],
					atrDeps: [
						{
							attr: "clntuh_end_date",
							linkTypes: ["join"],
						},
						{
							attr: "clntuh_gid",
							linkTypes: ["join"],
						},
						{
							attr: "clntuh_start_date",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client",
					attrMaps: [
						{
							src: "clnth_gid",
							dst: "clnth_gid",
						},
						{
							src: "clnth_start_date",
							dst: "clnth_start_date",
						},
						{
							src: "clnth_end_date",
							dst: "clnth_end_date",
						},
					],
					atrDeps: [
						{
							attr: "clnth_union_clntu_gid",
							linkTypes: ["join"],
						},
						{
							attr: "clnth_end_date",
							linkTypes: ["join"],
						},
						{
							attr: "clnth_start_date",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 14,
			entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step3",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step2",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
					],
					atrDeps: [
						{
							attr: "clnth_end_date",
							linkTypes: ["join"],
						},
						{
							attr: "inn",
							linkTypes: ["groupby"],
						},
						{
							attr: "clntuh_gid",
							linkTypes: ["join"],
						},
						{
							attr: "clntuh_start_date",
							linkTypes: ["join"],
						},
						{
							attr: "clntuh_end_date",
							linkTypes: ["join"],
						},
						{
							attr: "clnth_start_date",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_account",
					attrMaps: [
						{
							src: "acnth_open_date",
							dst: "first_acc_date",
						},
					],
					atrDeps: [
						{
							attr: "acnth_end_date",
							linkTypes: ["join"],
						},
						{
							attr: "acnth_start_date",
							linkTypes: ["join"],
						},
						{
							attr: "acnth_clnt_gid",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 15,
			entityId: "prod_dm_dadm_corp_wide/tech_kih_client_acc_information",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_first_acc_date",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
					],
					atrDeps: [],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step3",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
						{
							src: "report_date_part",
							dst: "report_date_part",
						},
					],
					atrDeps: [],
				},
			],
		},
		{
			id: 16,
			entityId: "prod_dm_dadm_corp_wide/int_data_tmp",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client_hist",
					attrMaps: [
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "report_date_part",
							dst: "report_date_part",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "client_type_id",
							dst: "client_type_id",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "report_date",
							dst: "report_date",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_cl_inn_inf",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tech_kih_client_acc_information",
					attrMaps: [
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
					],
					atrDeps: [
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_repl_ceh/active_client_hist",
					attrMaps: [
						{
							src: "client_slx_id",
							dst: "active_flg",
						},
					],
					atrDeps: [
						{
							attr: "hdp_processed_dttm",
							linkTypes: ["window", "where"],
						},
						{
							attr: "effective_to_date",
							linkTypes: ["where"],
						},
						{
							attr: "corp_roo_name",
							linkTypes: ["window", "where"],
						},
						{
							attr: "deleted_flg",
							linkTypes: ["where"],
						},
						{
							attr: "client_slx_id",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "effective_from_date",
							linkTypes: ["window", "where"],
						},
					],
				},
			],
		},
		{
			id: 17,
			entityId: "prod_dm_dadm_corp_wide/tmp_new_spark_status_delete",
			deps: [
				{
					entityId: "prod_external_spark/spark_companyhistoryreport_main",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "inn",
							dst: "cnt_prov_inn",
						},
						{
							src: "status_isacting",
							dst: "Status_GroupName",
						},
						{
							src: "status_groupname",
							dst: "Status_GroupName",
						},
						{
							src: "status_type",
							dst: "Status_Type",
						},
					],
					atrDeps: [
						{
							attr: "date_from",
							linkTypes: ["window", "where"],
						},
						{
							attr: "inn",
							linkTypes: ["window", "where", "groupby"],
						},
						{
							attr: "okopf_codenew",
							linkTypes: ["window", "where"],
						},
						{
							attr: "fullnamerus",
							linkTypes: ["window", "where"],
						},
						{
							attr: "federaltaxregistration_regdate",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_type",
							linkTypes: ["groupby"],
						},
						{
							attr: "status_groupname",
							linkTypes: ["groupby"],
						},
						{
							attr: "sparkid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_isacting",
							linkTypes: ["groupby"],
						},
					],
				},
				{
					entityId: "prod_external_spark/spark_entrepreneurshortreport_main",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "inn",
							dst: "cnt_prov_inn",
						},
						{
							src: "status_isacting",
							dst: "Status_GroupName",
						},
						{
							src: "status_groupname",
							dst: "Status_GroupName",
						},
						{
							src: "status_text",
							dst: "Status_Type",
						},
					],
					atrDeps: [
						{
							attr: "date_from",
							linkTypes: ["window", "where"],
						},
						{
							attr: "inn",
							linkTypes: ["window", "where", "groupby"],
						},
						{
							attr: "okopf_code",
							linkTypes: ["window", "where"],
						},
						{
							attr: "fullnamerus",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_text",
							linkTypes: ["groupby"],
						},
						{
							attr: "sparkid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "datereg",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_groupname",
							linkTypes: ["groupby"],
						},
						{
							attr: "status_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_isacting",
							linkTypes: ["groupby"],
						},
					],
				},
			],
		},
		{
			id: 18,
			entityId: "prod_dm_dadm_corp_wide/int_data_prev",
			deps: [
				{
					entityId: "ru.vtb.uopd.mlistener.Unmatched",
					attrMaps: [],
					atrDeps: [],
				},
			],
			unmatched: ["org.apache.spark.sql.catalyst.plans.logical.OneRowRelation"],
		},
		{
			id: 19,
			entityId: "prod_dm_dadm_corp_wide/int_data_prev",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/int_data_tmp",
					attrMaps: [
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "report_date_part",
							dst: "report_date_part",
						},
						{
							src: "pd",
							dst: "pd",
						},
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "gbl_detail",
							dst: "gbl_detail",
						},
						{
							src: "n_founders",
							dst: "n_founders",
						},
						{
							src: "stop_list_flag",
							dst: "stop_list_flag",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "processed_dttm",
							dst: "processed_dttm",
						},
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "inn",
							dst: "error_control_sum_inn",
						},
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "default_flag",
							dst: "default_flag",
						},
						{
							src: "slxid",
							dst: "duplicate_slxid",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "foreign_tax_flag",
							dst: "foreign_tax_flag",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "report_date",
							dst: "report_date",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "report_date_part",
							dst: "duplicate_slxid",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
						{
							src: "bank_client_date_from",
							dst: "bank_client_date_from",
						},
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "founders_type",
							dst: "founders_type",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
						{
							src: "inn",
							dst: "duplicate_slxid",
						},
						{
							src: "rating",
							dst: "rating",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "client_type_id",
							dst: "client_type_id",
						},
						{
							src: "refusal_flag",
							dst: "refusal_flag",
						},
						{
							src: "active_flg",
							dst: "active_flg",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [
						{
							attr: "report_date_part",
							linkTypes: ["window", "join"],
						},
						{
							attr: "inn",
							linkTypes: ["window", "join", "where", "groupby"],
						},
					],
				},
				{
					entityId: "org.apache.spark.rdd.MapPartitionsRDD/null",
					attrMaps: [
						{
							src: "num",
							dst: "error_control_sum_inn",
						},
						{
							src: "constanta_inn",
							dst: "error_control_sum_inn",
						},
					],
					atrDeps: [
						{
							attr: "constanta_inn",
							linkTypes: ["where"],
						},
						{
							attr: "num",
							linkTypes: ["where"],
						},
						{
							attr: "len_inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "org.apache.spark.rdd.MapPartitionsRDD/null",
					attrMaps: [
						{
							src: "num",
							dst: "error_control_sum_inn",
						},
						{
							src: "constanta_inn",
							dst: "error_control_sum_inn",
						},
					],
					atrDeps: [
						{
							attr: "constanta_inn",
							linkTypes: ["where"],
						},
						{
							attr: "num",
							linkTypes: ["where"],
						},
						{
							attr: "len_inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "org.apache.spark.rdd.MapPartitionsRDD/null",
					attrMaps: [
						{
							src: "num",
							dst: "error_control_sum_inn",
						},
						{
							src: "constanta_inn",
							dst: "error_control_sum_inn",
						},
					],
					atrDeps: [
						{
							attr: "constanta_inn",
							linkTypes: ["where", "groupby"],
						},
						{
							attr: "num",
							linkTypes: ["where", "groupby"],
						},
						{
							attr: "len_inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_new_spark_status_delete",
					attrMaps: [
						{
							src: "Status_GroupName",
							dst: "flg_liquidation",
						},
					],
					atrDeps: [
						{
							attr: "report_date",
							linkTypes: ["join"],
						},
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 20,
			entityId: "prod_dm_dadm_corp_wide/int_data_tmp_final",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/int_data",
					attrMaps: [
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "pd",
							dst: "pd",
						},
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
						{
							src: "duplicate_slxid",
							dst: "duplicate_slxid",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "flg_liquidation",
							dst: "flg_liquidation",
						},
						{
							src: "gbl_detail",
							dst: "gbl_detail",
						},
						{
							src: "n_founders",
							dst: "n_founders",
						},
						{
							src: "stop_list_flag",
							dst: "stop_list_flag",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "processed_dttm",
							dst: "processed_dttm",
						},
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "error_control_sum_inn",
							dst: "error_control_sum_inn",
						},
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "default_flag",
							dst: "default_flag",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "foreign_tax_flag",
							dst: "foreign_tax_flag",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "bank_client_date_from",
							dst: "bank_client_date_from",
						},
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "founders_type",
							dst: "founders_type",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
						{
							src: "rating",
							dst: "rating",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "client_type_id",
							dst: "client_type_id",
						},
						{
							src: "refusal_flag",
							dst: "refusal_flag",
						},
						{
							src: "active_flg",
							dst: "active_flg",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [
						{
							attr: "report_date",
							linkTypes: ["where", "window"],
						},
						{
							attr: "slxid",
							linkTypes: ["where", "window"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/int_data_prev",
					attrMaps: [
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "pd",
							dst: "pd",
						},
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
						{
							src: "duplicate_slxid",
							dst: "duplicate_slxid",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "flg_liquidation",
							dst: "flg_liquidation",
						},
						{
							src: "gbl_detail",
							dst: "gbl_detail",
						},
						{
							src: "n_founders",
							dst: "n_founders",
						},
						{
							src: "stop_list_flag",
							dst: "stop_list_flag",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "processed_dttm",
							dst: "processed_dttm",
						},
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "error_control_sum_inn",
							dst: "error_control_sum_inn",
						},
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "default_flag",
							dst: "default_flag",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "foreign_tax_flag",
							dst: "foreign_tax_flag",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "bank_client_date_from",
							dst: "bank_client_date_from",
						},
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "founders_type",
							dst: "founders_type",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
						{
							src: "rating",
							dst: "rating",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "client_type_id",
							dst: "client_type_id",
						},
						{
							src: "refusal_flag",
							dst: "refusal_flag",
						},
						{
							src: "active_flg",
							dst: "active_flg",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [
						{
							attr: "report_date",
							linkTypes: ["where", "window"],
						},
						{
							attr: "slxid",
							linkTypes: ["where", "window"],
						},
					],
				},
			],
		},
		{
			id: 21,
			entityId: "prod_dm_dadm_corp_wide/int_data_log",
			deps: [
				{
					entityId: "org.apache.spark.rdd.MapPartitionsRDD/null",
					attrMaps: [
						{
							src: "process_dttm",
							dst: "process_dttm",
						},
						{
							src: "status",
							dst: "status",
						},
						{
							src: "description",
							dst: "description",
						},
					],
					atrDeps: [],
				},
			],
		},
		{
			id: 22,
			entityId: "prod_dm_dadm_corp_wide/int_data",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/int_data_tmp_final",
					attrMaps: [
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "report_date_part",
							dst: "report_date_part",
						},
						{
							src: "pd",
							dst: "pd",
						},
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
						{
							src: "duplicate_slxid",
							dst: "duplicate_slxid",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "flg_liquidation",
							dst: "flg_liquidation",
						},
						{
							src: "gbl_detail",
							dst: "gbl_detail",
						},
						{
							src: "n_founders",
							dst: "n_founders",
						},
						{
							src: "stop_list_flag",
							dst: "stop_list_flag",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "processed_dttm",
							dst: "processed_dttm",
						},
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "error_control_sum_inn",
							dst: "error_control_sum_inn",
						},
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "default_flag",
							dst: "default_flag",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "foreign_tax_flag",
							dst: "foreign_tax_flag",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "report_date",
							dst: "report_date",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "bank_client_date_from",
							dst: "bank_client_date_from",
						},
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "founders_type",
							dst: "founders_type",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
						{
							src: "rating",
							dst: "rating",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "client_type_id",
							dst: "client_type_id",
						},
						{
							src: "refusal_flag",
							dst: "refusal_flag",
						},
						{
							src: "active_flg",
							dst: "active_flg",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [],
				},
			],
		},
		{
			id: 23,
			entityId: "prod_dm_dadm_corp_wide/tmp_analitical",
			deps: [
				{
					entityId: "prod_repl_subo_csep/csep_analytical",
					attrMaps: [
						{
							src: "name_organisationname_name_multitext_ru",
							dst: "gsl_name",
						},
						{
							src: "cib",
							dst: "gbl",
						},
						{
							src: "name_organisationname_fullname_multitext_ru",
							dst: "org_nm",
						},
						{
							src: "processed_dt",
							dst: "processed_dt",
						},
						{
							src: "profileclientindustryentryref_key",
							dst: "industry_id",
						},
						{
							src: "id_id",
							dst: "gsl_slxid",
						},
						{
							src: "smb",
							dst: "gbl",
						},
						{
							src: "id_id",
							dst: "slxid",
						},
						{
							src: "urfu",
							dst: "gbl",
						},
					],
					atrDeps: [
						{
							attr: "analyticalorganisationprofileref_id_id",
							linkTypes: ["join"],
						},
						{
							attr: "id_id",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
						{
							attr: "op_scn",
							linkTypes: ["window", "where"],
						},
						{
							attr: "commit_ts",
							linkTypes: ["window", "where"],
						},
						{
							attr: "profileclientindustryentryref_key",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId:
						"prod_repl_subo_csep/csep_dictionary_organisationprofileclientindustrydictionary",
					attrMaps: [
						{
							src: "organisationprofiledictionaryentry_name",
							dst: "industry_name",
						},
					],
					atrDeps: [
						{
							attr: "organisationprofiledictionaryentry_parentid",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
					],
				},
			],
		},
		{
			id: 24,
			entityId: "prod_dm_dadm_corp_wide/tmp_local",
			deps: [
				{
					entityId:
						"prod_repl_subo_csep/csep_analytical_localinfo_organisation_localparams",
					attrMaps: [
						{
							src: "id_id",
							dst: "slxid",
						},
						{
							src: "processed_dt",
							dst: "processed_dt",
						},
						{
							src: "parametertypeentry_key",
							dst: "parametertypeentry_key",
						},
					],
					atrDeps: [
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
						{
							attr: "op_scn",
							linkTypes: ["window", "where"],
						},
						{
							attr: "id_id",
							linkTypes: ["window", "where"],
						},
						{
							attr: "parametertypeentry_key",
							linkTypes: ["join"],
						},
						{
							attr: "commit_ts",
							linkTypes: ["window", "where"],
						},
					],
				},
				{
					entityId:
						"prod_repl_subo_csep/csep_dictionary_localanalyticalparametertype",
					attrMaps: [
						{
							src: "organisationprofiledictionaryentry_name",
							dst: "problem_flag",
						},
					],
					atrDeps: [
						{
							attr: "op_scn",
							linkTypes: ["window", "where"],
						},
						{
							attr: "commit_ts",
							linkTypes: ["window", "where"],
						},
						{
							attr: "organisationprofiledictionaryentry_parentid",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
					],
				},
			],
		},
		{
			id: 25,
			entityId: "prod_dm_dadm_corp_wide/tmp_segment",
			deps: [
				{
					entityId:
						"prod_repl_subo_csep/csep_organisationprofilesegmentassignment_segments",
					attrMaps: [
						{
							src: "id_id",
							dst: "slxid",
						},
						{
							src: "profileclientsegmentref_key",
							dst: "segment_id",
						},
					],
					atrDeps: [
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
						{
							attr: "updatetime",
							linkTypes: ["window", "where"],
						},
						{
							attr: "profileclientsegmentref_key",
							linkTypes: ["join"],
						},
						{
							attr: "id_id",
							linkTypes: ["window", "where"],
						},
						{
							attr: "from",
							linkTypes: ["window", "where"],
						},
					],
				},
				{
					entityId:
						"prod_repl_subo_csep/csep_dictionary_organisationprofilebusinesscategorydictionary",
					attrMaps: [
						{
							src: "organisationprofiledictionaryentry_name",
							dst: "segment_name",
						},
					],
					atrDeps: [
						{
							attr: "op_scn",
							linkTypes: ["window", "where"],
						},
						{
							attr: "commit_ts",
							linkTypes: ["window", "where"],
						},
						{
							attr: "organisationprofiledictionaryentry_parentid",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "processed_dt",
							linkTypes: ["window", "where"],
						},
					],
				},
			],
		},
		{
			id: 26,
			entityId: "prod_dm_dadm_corp_wide/tmp_sales_point",
			deps: [
				{
					entityId: "prod_repl_subo_csfg/csfg_business_unit",
					attrMaps: [
						{
							src: "id_id",
							dst: "id_id",
						},
						{
							src: "organisationunit_key",
							dst: "sales_point_id",
						},
						{
							src: "name",
							dst: "sales_point_name",
						},
					],
					atrDeps: [
						{
							attr: "type_key",
							linkTypes: ["where"],
						},
						{
							attr: "organisationunit_key",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_repl_shcm/orgunitadrinfo",
					attrMaps: [
						{
							src: "kregio",
							dst: "detailed_region_cd",
						},
					],
					atrDeps: [
						{
							attr: "effective_from_dttm",
							linkTypes: ["where"],
						},
						{
							attr: "effective_to_dttm",
							linkTypes: ["where"],
						},
						{
							attr: "kregio",
							linkTypes: ["join"],
						},
						{
							attr: "ou_id",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_repl_ods_acpd/h2_c_dadm_de_c_s_cl_pr_u",
					attrMaps: [
						{
							src: "key_1",
							dst: "region_name",
						},
						{
							src: "key_1",
							dst: "region_cd",
						},
						{
							src: "value",
							dst: "region_cd",
						},
						{
							src: "value",
							dst: "region_name",
						},
						{
							src: "key_1",
							dst: "detailed_region_name",
						},
						{
							src: "value",
							dst: "detailed_region_name",
						},
					],
					atrDeps: [
						{
							attr: "odsis_active_flg",
							linkTypes: ["where"],
						},
						{
							attr: "value",
							linkTypes: ["join"],
						},
						{
							attr: "tabl_name_use_spr",
							linkTypes: ["where"],
						},
						{
							attr: "shor_spr_name",
							linkTypes: ["where"],
						},
						{
							attr: "hub_stte_ind",
							linkTypes: ["where"],
						},
						{
							attr: "end_date",
							linkTypes: ["where"],
						},
						{
							attr: "key_1",
							linkTypes: ["join"],
						},
						{
							attr: "odseffective_to_dt",
							linkTypes: ["where"],
						},
						{
							attr: "id",
							linkTypes: ["groupby"],
						},
					],
				},
			],
		},
		{
			id: 27,
			entityId: "prod_dm_dadm_corp_wide/tmp_client_hist",
			deps: [
				{
					entityId: "prod_repl_subo_csep/csep_assigmentservice_teams",
					attrMaps: [
						{
							src: "department_clienttype_corporateclientstatustypevalues",
							dst: "client_type_id",
						},
					],
					atrDeps: [
						{
							attr: "id_id",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "department_clienttype_corporateclientstatustypevalues",
							linkTypes: ["window", "where"],
						},
						{
							attr: "department_organisationunitref_key",
							linkTypes: ["join"],
						},
						{
							attr: "department_organisationunitref_dictionaryref_id",
							linkTypes: ["where"],
						},
						{
							attr: "processed_dt",
							linkTypes: ["where"],
						},
						{
							attr: "type_assignmenttypevalues",
							linkTypes: ["where"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_segment",
					attrMaps: [
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_sales_point",
					attrMaps: [
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [
						{
							attr: "id_id",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_local",
					attrMaps: [
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_analitical",
					attrMaps: [
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "processed_dt",
							dst: "processed_dt",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "report_date",
							dst: "report_date",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 28,
			entityId: "prod_dm_dadm_corp_wide/tmp_cl_inn_inf",
			deps: [
				{
					entityId: "prod_kih_full_export/e46_ref_subject_h_f_v",
					attrMaps: [
						{
							src: "sbjh_inn",
							dst: "inn",
						},
						{
							src: "sbjh_inn",
							dst: "salt_num_inn",
						},
					],
					atrDeps: [
						{
							attr: "sbjh_id",
							linkTypes: ["window", "where"],
						},
						{
							attr: "sbjh_inn",
							linkTypes: ["where"],
						},
						{
							attr: "sbjh_start_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "sbjh_row_status",
							linkTypes: ["where"],
						},
						{
							attr: "sbjh_end_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "sbjh_source_id",
							linkTypes: ["window", "join", "where"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client_hist",
					attrMaps: [
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 29,
			entityId: "prod_dm_dadm_corp_wide/tmp_first_acc_date",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/int_data",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
					],
					atrDeps: [
						{
							attr: "first_acc_date",
							linkTypes: ["where"],
						},
						{
							attr: "report_date_part",
							linkTypes: ["where"],
						},
						{
							attr: "inn",
							linkTypes: ["groupby"],
						},
					],
				},
			],
		},
		{
			id: 30,
			entityId: "prod_dm_dadm_corp_wide/tmp_cl_look",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_cl_inn_inf",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "salt_num_inn",
							dst: "salt_num_inn",
						},
					],
					atrDeps: [
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_first_acc_date",
					attrMaps: [],
					atrDeps: [
						{
							attr: "first_acc_date",
							linkTypes: ["where"],
						},
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 31,
			entityId: "prod_dm_dadm_corp_wide/tmp_client_union",
			deps: [
				{
					entityId: "prod_kih_full_export/e46_ref_client_union_h_f_v",
					attrMaps: [
						{
							src: "clntuh_end_date",
							dst: "clntuh_end_date",
						},
						{
							src: "clntuh_inn",
							dst: "clntuh_inn",
						},
						{
							src: "clntuh_gid",
							dst: "clntuh_gid",
						},
						{
							src: "clntuh_inn",
							dst: "salt_num_inn_cl",
						},
						{
							src: "clntuh_start_date",
							dst: "clntuh_start_date",
						},
					],
					atrDeps: [
						{
							attr: "clntuh_end_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clntuh_row_status",
							linkTypes: ["where"],
						},
						{
							attr: "clntuh_gid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clntuh_start_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clntuh_inn",
							linkTypes: ["window", "join", "where"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_cl_look",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "salt_num_inn",
							dst: "salt_num_inn",
						},
					],
					atrDeps: [
						{
							attr: "salt_num_inn",
							linkTypes: ["join"],
						},
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 32,
			entityId: "prod_dm_dadm_corp_wide/tmp_client",
			deps: [
				{
					entityId: "prod_kih_full_export/e46_ref_client_h_f_v",
					attrMaps: [
						{
							src: "clnth_gid",
							dst: "clnth_gid",
						},
						{
							src: "clnth_union_clntu_gid",
							dst: "clnth_union_clntu_gid",
						},
						{
							src: "clnth_start_date",
							dst: "clnth_start_date",
						},
						{
							src: "clnth_end_date",
							dst: "clnth_end_date",
						},
					],
					atrDeps: [
						{
							attr: "clnth_row_status",
							linkTypes: ["where"],
						},
						{
							attr: "clnth_gid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clnth_end_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clnth_union_clntu_gid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "clnth_start_date",
							linkTypes: ["window", "where"],
						},
					],
				},
			],
		},
		{
			id: 33,
			entityId: "prod_dm_dadm_corp_wide/tmp_client_join",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client",
					attrMaps: [
						{
							src: "clnth_gid",
							dst: "clnth_gid",
						},
					],
					atrDeps: [
						{
							attr: "clnth_gid",
							linkTypes: ["groupby"],
						},
						{
							attr: "clnth_union_clntu_gid",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client_union",
					attrMaps: [],
					atrDeps: [
						{
							attr: "clntuh_gid",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 34,
			entityId: "prod_dm_dadm_corp_wide/tmp_account",
			deps: [
				{
					entityId: "prod_kih_full_export/e46_ref_account_h_f_v",
					attrMaps: [
						{
							src: "acnth_end_date",
							dst: "acnth_end_date",
						},
						{
							src: "acnth_clnt_gid",
							dst: "acnth_clnt_gid",
						},
						{
							src: "acnth_open_date",
							dst: "acnth_open_date",
						},
						{
							src: "acnth_start_date",
							dst: "acnth_start_date",
						},
						{
							src: "acnth_gid",
							dst: "acnth_gid",
						},
					],
					atrDeps: [
						{
							attr: "acnth_clnt_gid",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "acnth_start_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "acnth_end_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "acnth_gid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "acnth_row_status",
							linkTypes: ["where"],
						},
						{
							attr: "acnth_open_date",
							linkTypes: ["where"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client_join",
					attrMaps: [
						{
							src: "count",
							dst: "count",
						},
					],
					atrDeps: [
						{
							attr: "clnth_gid",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 35,
			entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step1",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_cl_look",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
					],
					atrDeps: [
						{
							attr: "salt_num_inn",
							linkTypes: ["join"],
						},
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client_union",
					attrMaps: [
						{
							src: "clntuh_gid",
							dst: "clntuh_gid",
						},
						{
							src: "clntuh_start_date",
							dst: "clntuh_start_date",
						},
						{
							src: "clntuh_end_date",
							dst: "clntuh_end_date",
						},
					],
					atrDeps: [
						{
							attr: "salt_num_inn_cl",
							linkTypes: ["join"],
						},
						{
							attr: "clntuh_inn",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 36,
			entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step2",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step1",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "clntuh_gid",
							dst: "clntuh_gid",
						},
						{
							src: "clntuh_start_date",
							dst: "clntuh_start_date",
						},
						{
							src: "clntuh_end_date",
							dst: "clntuh_end_date",
						},
					],
					atrDeps: [
						{
							attr: "clntuh_end_date",
							linkTypes: ["join"],
						},
						{
							attr: "clntuh_gid",
							linkTypes: ["join"],
						},
						{
							attr: "clntuh_start_date",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client",
					attrMaps: [
						{
							src: "clnth_gid",
							dst: "clnth_gid",
						},
						{
							src: "clnth_start_date",
							dst: "clnth_start_date",
						},
						{
							src: "clnth_end_date",
							dst: "clnth_end_date",
						},
					],
					atrDeps: [
						{
							attr: "clnth_union_clntu_gid",
							linkTypes: ["join"],
						},
						{
							attr: "clnth_end_date",
							linkTypes: ["join"],
						},
						{
							attr: "clnth_start_date",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 37,
			entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step3",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step2",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
					],
					atrDeps: [
						{
							attr: "clnth_end_date",
							linkTypes: ["join"],
						},
						{
							attr: "inn",
							linkTypes: ["groupby"],
						},
						{
							attr: "clntuh_gid",
							linkTypes: ["join"],
						},
						{
							attr: "clntuh_start_date",
							linkTypes: ["join"],
						},
						{
							attr: "clntuh_end_date",
							linkTypes: ["join"],
						},
						{
							attr: "clnth_start_date",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_account",
					attrMaps: [
						{
							src: "acnth_open_date",
							dst: "first_acc_date",
						},
					],
					atrDeps: [
						{
							attr: "acnth_end_date",
							linkTypes: ["join"],
						},
						{
							attr: "acnth_start_date",
							linkTypes: ["join"],
						},
						{
							attr: "acnth_clnt_gid",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 38,
			entityId: "prod_dm_dadm_corp_wide/tech_kih_client_acc_information",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_first_acc_date",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
					],
					atrDeps: [],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_min_date_step3",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
						{
							src: "report_date_part",
							dst: "report_date_part",
						},
					],
					atrDeps: [],
				},
			],
		},
		{
			id: 39,
			entityId: "prod_dm_dadm_corp_wide/int_data_tmp",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_client_hist",
					attrMaps: [
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "report_date_part",
							dst: "report_date_part",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "client_type_id",
							dst: "client_type_id",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "report_date",
							dst: "report_date",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_cl_inn_inf",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
					],
					atrDeps: [
						{
							attr: "slxid",
							linkTypes: ["join"],
						},
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/tech_kih_client_acc_information",
					attrMaps: [
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
					],
					atrDeps: [
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_repl_ceh/active_client_hist",
					attrMaps: [
						{
							src: "client_slx_id",
							dst: "active_flg",
						},
					],
					atrDeps: [
						{
							attr: "hdp_processed_dttm",
							linkTypes: ["window", "where"],
						},
						{
							attr: "effective_to_date",
							linkTypes: ["where"],
						},
						{
							attr: "corp_roo_name",
							linkTypes: ["window", "where"],
						},
						{
							attr: "deleted_flg",
							linkTypes: ["where"],
						},
						{
							attr: "client_slx_id",
							linkTypes: ["window", "join", "where"],
						},
						{
							attr: "effective_from_date",
							linkTypes: ["window", "where"],
						},
					],
				},
			],
		},
		{
			id: 40,
			entityId: "prod_dm_dadm_corp_wide/tmp_new_spark_status_delete",
			deps: [
				{
					entityId: "prod_external_spark/spark_companyhistoryreport_main",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "inn",
							dst: "cnt_prov_inn",
						},
						{
							src: "status_isacting",
							dst: "Status_GroupName",
						},
						{
							src: "status_groupname",
							dst: "Status_GroupName",
						},
						{
							src: "status_type",
							dst: "Status_Type",
						},
					],
					atrDeps: [
						{
							attr: "date_from",
							linkTypes: ["window", "where"],
						},
						{
							attr: "inn",
							linkTypes: ["window", "where", "groupby"],
						},
						{
							attr: "okopf_codenew",
							linkTypes: ["window", "where"],
						},
						{
							attr: "fullnamerus",
							linkTypes: ["window", "where"],
						},
						{
							attr: "federaltaxregistration_regdate",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_type",
							linkTypes: ["groupby"],
						},
						{
							attr: "status_groupname",
							linkTypes: ["groupby"],
						},
						{
							attr: "sparkid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_isacting",
							linkTypes: ["groupby"],
						},
					],
				},
				{
					entityId: "prod_external_spark/spark_entrepreneurshortreport_main",
					attrMaps: [
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "inn",
							dst: "cnt_prov_inn",
						},
						{
							src: "status_isacting",
							dst: "Status_GroupName",
						},
						{
							src: "status_groupname",
							dst: "Status_GroupName",
						},
						{
							src: "status_text",
							dst: "Status_Type",
						},
					],
					atrDeps: [
						{
							attr: "date_from",
							linkTypes: ["window", "where"],
						},
						{
							attr: "inn",
							linkTypes: ["window", "where", "groupby"],
						},
						{
							attr: "okopf_code",
							linkTypes: ["window", "where"],
						},
						{
							attr: "fullnamerus",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_text",
							linkTypes: ["groupby"],
						},
						{
							attr: "sparkid",
							linkTypes: ["window", "where"],
						},
						{
							attr: "datereg",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_groupname",
							linkTypes: ["groupby"],
						},
						{
							attr: "status_date",
							linkTypes: ["window", "where"],
						},
						{
							attr: "status_isacting",
							linkTypes: ["groupby"],
						},
					],
				},
			],
		},
		{
			id: 41,
			entityId: "prod_dm_dadm_corp_wide/int_data_prev",
			deps: [
				{
					entityId: "ru.vtb.uopd.mlistener.Unmatched",
					attrMaps: [],
					atrDeps: [],
				},
			],
			unmatched: ["org.apache.spark.sql.catalyst.plans.logical.OneRowRelation"],
		},
		{
			id: 42,
			entityId: "prod_dm_dadm_corp_wide/int_data_prev",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/tmp_new_spark_status_delete",
					attrMaps: [
						{
							src: "Status_GroupName",
							dst: "flg_liquidation",
						},
					],
					atrDeps: [
						{
							attr: "report_date",
							linkTypes: ["join"],
						},
						{
							attr: "inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "org.apache.spark.rdd.MapPartitionsRDD/null",
					attrMaps: [
						{
							src: "num",
							dst: "error_control_sum_inn",
						},
						{
							src: "constanta_inn",
							dst: "error_control_sum_inn",
						},
					],
					atrDeps: [
						{
							attr: "constanta_inn",
							linkTypes: ["where", "groupby"],
						},
						{
							attr: "num",
							linkTypes: ["where", "groupby"],
						},
						{
							attr: "len_inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "org.apache.spark.rdd.MapPartitionsRDD/null",
					attrMaps: [
						{
							src: "num",
							dst: "error_control_sum_inn",
						},
						{
							src: "constanta_inn",
							dst: "error_control_sum_inn",
						},
					],
					atrDeps: [
						{
							attr: "constanta_inn",
							linkTypes: ["where"],
						},
						{
							attr: "num",
							linkTypes: ["where"],
						},
						{
							attr: "len_inn",
							linkTypes: ["join"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/int_data_tmp",
					attrMaps: [
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "report_date_part",
							dst: "report_date_part",
						},
						{
							src: "pd",
							dst: "pd",
						},
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "gbl_detail",
							dst: "gbl_detail",
						},
						{
							src: "n_founders",
							dst: "n_founders",
						},
						{
							src: "stop_list_flag",
							dst: "stop_list_flag",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "processed_dttm",
							dst: "processed_dttm",
						},
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "inn",
							dst: "error_control_sum_inn",
						},
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "default_flag",
							dst: "default_flag",
						},
						{
							src: "slxid",
							dst: "duplicate_slxid",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "foreign_tax_flag",
							dst: "foreign_tax_flag",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "report_date",
							dst: "report_date",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "report_date_part",
							dst: "duplicate_slxid",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
						{
							src: "bank_client_date_from",
							dst: "bank_client_date_from",
						},
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "founders_type",
							dst: "founders_type",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
						{
							src: "inn",
							dst: "duplicate_slxid",
						},
						{
							src: "rating",
							dst: "rating",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "client_type_id",
							dst: "client_type_id",
						},
						{
							src: "refusal_flag",
							dst: "refusal_flag",
						},
						{
							src: "active_flg",
							dst: "active_flg",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [
						{
							attr: "report_date_part",
							linkTypes: ["window", "join"],
						},
						{
							attr: "inn",
							linkTypes: ["window", "join", "where", "groupby"],
						},
					],
				},
				{
					entityId: "org.apache.spark.rdd.MapPartitionsRDD/null",
					attrMaps: [
						{
							src: "num",
							dst: "error_control_sum_inn",
						},
						{
							src: "constanta_inn",
							dst: "error_control_sum_inn",
						},
					],
					atrDeps: [
						{
							attr: "constanta_inn",
							linkTypes: ["where"],
						},
						{
							attr: "num",
							linkTypes: ["where"],
						},
						{
							attr: "len_inn",
							linkTypes: ["join"],
						},
					],
				},
			],
		},
		{
			id: 43,
			entityId: "prod_dm_dadm_corp_wide/int_data_log",
			deps: [
				{
					entityId: "org.apache.spark.rdd.MapPartitionsRDD/null",
					attrMaps: [
						{
							src: "process_dttm",
							dst: "process_dttm",
						},
						{
							src: "status",
							dst: "status",
						},
						{
							src: "description",
							dst: "description",
						},
					],
					atrDeps: [],
				},
			],
		},
		{
			id: 44,
			entityId: "prod_dm_dadm_corp_wide/int_data_tmp_final",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/int_data",
					attrMaps: [
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "pd",
							dst: "pd",
						},
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
						{
							src: "duplicate_slxid",
							dst: "duplicate_slxid",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "flg_liquidation",
							dst: "flg_liquidation",
						},
						{
							src: "gbl_detail",
							dst: "gbl_detail",
						},
						{
							src: "n_founders",
							dst: "n_founders",
						},
						{
							src: "stop_list_flag",
							dst: "stop_list_flag",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "processed_dttm",
							dst: "processed_dttm",
						},
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "error_control_sum_inn",
							dst: "error_control_sum_inn",
						},
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "default_flag",
							dst: "default_flag",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "foreign_tax_flag",
							dst: "foreign_tax_flag",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "bank_client_date_from",
							dst: "bank_client_date_from",
						},
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "founders_type",
							dst: "founders_type",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
						{
							src: "rating",
							dst: "rating",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "client_type_id",
							dst: "client_type_id",
						},
						{
							src: "refusal_flag",
							dst: "refusal_flag",
						},
						{
							src: "active_flg",
							dst: "active_flg",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [
						{
							attr: "report_date",
							linkTypes: ["where", "window"],
						},
						{
							attr: "slxid",
							linkTypes: ["where", "window"],
						},
					],
				},
				{
					entityId: "prod_dm_dadm_corp_wide/int_data_prev",
					attrMaps: [
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "pd",
							dst: "pd",
						},
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
						{
							src: "duplicate_slxid",
							dst: "duplicate_slxid",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "flg_liquidation",
							dst: "flg_liquidation",
						},
						{
							src: "gbl_detail",
							dst: "gbl_detail",
						},
						{
							src: "n_founders",
							dst: "n_founders",
						},
						{
							src: "stop_list_flag",
							dst: "stop_list_flag",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "processed_dttm",
							dst: "processed_dttm",
						},
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "error_control_sum_inn",
							dst: "error_control_sum_inn",
						},
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "default_flag",
							dst: "default_flag",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "foreign_tax_flag",
							dst: "foreign_tax_flag",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "bank_client_date_from",
							dst: "bank_client_date_from",
						},
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "founders_type",
							dst: "founders_type",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
						{
							src: "rating",
							dst: "rating",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "client_type_id",
							dst: "client_type_id",
						},
						{
							src: "refusal_flag",
							dst: "refusal_flag",
						},
						{
							src: "active_flg",
							dst: "active_flg",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [
						{
							attr: "report_date",
							linkTypes: ["where", "window"],
						},
						{
							attr: "slxid",
							linkTypes: ["where", "window"],
						},
					],
				},
			],
		},
		{
			id: 45,
			entityId: "prod_dm_dadm_corp_wide/int_data",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/int_data_tmp_final",
					attrMaps: [
						{
							src: "segment_id",
							dst: "segment_id",
						},
						{
							src: "report_date_part",
							dst: "report_date_part",
						},
						{
							src: "pd",
							dst: "pd",
						},
						{
							src: "problem_flag",
							dst: "problem_flag",
						},
						{
							src: "duplicate_slxid",
							dst: "duplicate_slxid",
						},
						{
							src: "first_acc_date",
							dst: "first_acc_date",
						},
						{
							src: "slxid",
							dst: "slxid",
						},
						{
							src: "flg_liquidation",
							dst: "flg_liquidation",
						},
						{
							src: "gbl_detail",
							dst: "gbl_detail",
						},
						{
							src: "n_founders",
							dst: "n_founders",
						},
						{
							src: "stop_list_flag",
							dst: "stop_list_flag",
						},
						{
							src: "detailed_region_name",
							dst: "detailed_region_name",
						},
						{
							src: "processed_dttm",
							dst: "processed_dttm",
						},
						{
							src: "gsl_name",
							dst: "gsl_name",
						},
						{
							src: "error_control_sum_inn",
							dst: "error_control_sum_inn",
						},
						{
							src: "sales_point_id",
							dst: "sales_point_id",
						},
						{
							src: "inn",
							dst: "inn",
						},
						{
							src: "default_flag",
							dst: "default_flag",
						},
						{
							src: "org_nm",
							dst: "org_nm",
						},
						{
							src: "foreign_tax_flag",
							dst: "foreign_tax_flag",
						},
						{
							src: "industry_name",
							dst: "industry_name",
						},
						{
							src: "report_date",
							dst: "report_date",
						},
						{
							src: "detailed_region_cd",
							dst: "detailed_region_cd",
						},
						{
							src: "gsl_slxid",
							dst: "gsl_slxid",
						},
						{
							src: "bank_client_date_from",
							dst: "bank_client_date_from",
						},
						{
							src: "clientid",
							dst: "clientid",
						},
						{
							src: "sales_point_name",
							dst: "sales_point_name",
						},
						{
							src: "founders_type",
							dst: "founders_type",
						},
						{
							src: "segment_name",
							dst: "segment_name",
						},
						{
							src: "rating",
							dst: "rating",
						},
						{
							src: "gbl",
							dst: "gbl",
						},
						{
							src: "client_type_id",
							dst: "client_type_id",
						},
						{
							src: "refusal_flag",
							dst: "refusal_flag",
						},
						{
							src: "active_flg",
							dst: "active_flg",
						},
						{
							src: "industry_id",
							dst: "industry_id",
						},
						{
							src: "region_cd",
							dst: "region_cd",
						},
						{
							src: "region_name",
							dst: "region_name",
						},
					],
					atrDeps: [],
				},
			],
		},
		{
			id: 46,
			entityId: "prod_dm_dadm_corp_wide/int_data_log",
			deps: [
				{
					entityId: "org.apache.spark.rdd.MapPartitionsRDD/null",
					attrMaps: [
						{
							src: "process_dttm",
							dst: "process_dttm",
						},
						{
							src: "status",
							dst: "status",
						},
						{
							src: "description",
							dst: "description",
						},
					],
					atrDeps: [],
				},
			],
		},
		{
			id: 47,
			entityId: "prod_dm_dadm_corp_wide/int_data_log",
			deps: [
				{
					entityId: "org.apache.spark.rdd.MapPartitionsRDD/null",
					attrMaps: [
						{
							src: "process_dttm",
							dst: "process_dttm",
						},
						{
							src: "status",
							dst: "status",
						},
						{
							src: "description",
							dst: "description",
						},
					],
					atrDeps: [],
				},
			],
		},
		{
			id: 48,
			entityId: "prod_dm_dadm_corp_wide/int_data_log_repl_tmp",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/int_data_log",
					attrMaps: [
						{
							src: "process_dttm",
							dst: "process_dttm",
						},
						{
							src: "status",
							dst: "status",
						},
						{
							src: "description",
							dst: "description",
						},
					],
					atrDeps: [],
				},
			],
		},
		{
			id: 49,
			entityId: "prod_dm_dadm_corp_wide/int_data_log",
			deps: [
				{
					entityId: "prod_dm_dadm_corp_wide/int_data_log_repl_tmp",
					attrMaps: [
						{
							src: "process_dttm",
							dst: "process_dttm",
						},
						{
							src: "status",
							dst: "status",
						},
						{
							src: "description",
							dst: "description",
						},
					],
					atrDeps: [],
				},
			],
		},
	],
	failedMappings: [],
};
