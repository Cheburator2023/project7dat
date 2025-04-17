export const useTranslations = (_v?: string, _g?: any) => {
	return (v?: string, g?: any) => {
		const suff = g ? JSON.stringify(g || {}) : "";

		return suff ? v + " " + suff : v || "no_translation";
	};
};
