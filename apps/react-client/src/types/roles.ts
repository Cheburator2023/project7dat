export enum Role {
	ADMIN_IT = "admin_it",
	ADMIN_IT_LEAD = "admin_it_lead",
	VALIDATOR_LEAD = "validator_lead",
	VALIDATOR = "validator",
	BUSINESS_CUSTOMER = "business_customer",
	BI_CUSTOMER_BROKER = "bi_business_customer_broker",
	DS = "ds",
	DE = "de",
	DS_LEAD = "ds_lead",
	DE_LEAD = "de_lead",
	MODEL_OPS = "modelops",
	MODEL_OPS_LEAD = "modelops_lead",
	MIPM = "mipm",
}
export type UserRoles = Role[];

export enum Permission {
	DL_COMMIT_IMPORT_S2T = "dl_commit_import_s2t",
	DL_COMMIT_EDIT_DESCRIPTION = "dl_commit_edit_description",
	DL_COMMIT_APLAY = "dl_commit_aplay",
	DL_COMMIT_EDIT_DATA = "dl_commit_edit_data",
	DL_COMMIT_ABORT = "dl_commit_abort",
	DL_COMMIT_DELETE = "dl_commit_delete",
}
export type UserPermissions = Permission[];
