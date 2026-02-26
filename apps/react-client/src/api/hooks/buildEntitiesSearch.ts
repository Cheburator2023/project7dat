export const HIDE_TEMP_TABLES_TOKEN = "__HIDE_TEMP_TABLES__";

export const buildEntitiesSearch = (params: {
	uiSearch?: string;
	hideTempTables: boolean;
}): string | undefined => {
	const search = (params.uiSearch ?? "").trim();
	if (!params.hideTempTables) {
		return search ? search : undefined;
	}

	if (!search) {
		return HIDE_TEMP_TABLES_TOKEN;
	}

	return `${search} ${HIDE_TEMP_TABLES_TOKEN}`;
};
