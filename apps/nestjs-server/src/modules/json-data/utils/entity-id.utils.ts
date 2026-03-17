/**
 * Утилиты для работы с составным идентификатором сущности.
 *
 * В JSON формате entity.id = `${full_name}.${system_code}` (напр. "dbo/customers.1642").
 * В БД entity.full_name хранит ТОЛЬКО full_name (напр. "dbo/customers"),
 * а system_code живёт в entity_container → systems.code.
 *
 * Эти утилиты обеспечивают единообразное построение и разбор composite id
 * во всех сервисах, предотвращая дублирование сущностей.
 */

const DEFAULT_SYSTEM_CODE = "1642";

/**
 * Разделитель между full_name и system_code в composite id.
 * Используем последнюю точку, т.к. full_name может содержать точки (напр. "schema.table").
 */
const SYSTEM_CODE_SEPARATOR = ".";

export interface ParsedEntityId {
	fullName: string;
	systemCode: string;
}

/**
 * Собирает composite id сущности из full_name и system_code.
 *
 * @example
 * buildEntityCompositeId("dbo/customers", "1642") → "dbo/customers.1642"
 * buildEntityCompositeId("dbo/customers", null)    → "dbo/customers.1642"
 */
export const buildEntityCompositeId = (
	fullName: string,
	systemCode: string | null | undefined,
): string => {
	return `${fullName}${SYSTEM_CODE_SEPARATOR}${systemCode || DEFAULT_SYSTEM_CODE}`;
};

/**
 * Разбирает composite id на full_name и system_code.
 * System_code — это последний сегмент после последней точки,
 * но ТОЛЬКО если он похож на числовой код (1-6 цифр).
 * Иначе считаем что весь id — это full_name без system_code.
 *
 * @example
 * parseEntityCompositeId("dbo/customers.1642")  → { fullName: "dbo/customers", systemCode: "1642" }
 * parseEntityCompositeId("schema.table.1655")   → { fullName: "schema.table", systemCode: "1655" }
 * parseEntityCompositeId("dbo/customers")       → { fullName: "dbo/customers", systemCode: "1642" }
 * parseEntityCompositeId("simple_table")        → { fullName: "simple_table", systemCode: "1642" }
 */
export const parseEntityCompositeId = (compositeId: string): ParsedEntityId => {
	if (!compositeId) {
		return { fullName: "", systemCode: DEFAULT_SYSTEM_CODE };
	}

	const lastDotIndex = compositeId.lastIndexOf(SYSTEM_CODE_SEPARATOR);
	if (lastDotIndex === -1) {
		return { fullName: compositeId, systemCode: DEFAULT_SYSTEM_CODE };
	}

	const possibleCode = compositeId.substring(lastDotIndex + 1);

	// System_code — числовой код длиной 1-6 символов
	if (/^\d[\d_]{0,31}$/.test(possibleCode)) {
		return {
			fullName: compositeId.substring(0, lastDotIndex),
			systemCode: possibleCode,
		};
	}

	// Не похоже на system_code — весь id это full_name
	return { fullName: compositeId, systemCode: DEFAULT_SYSTEM_CODE };
};

/**
 * Извлекает full_name из composite id (убирает system_code если есть).
 * Удобно для поиска в БД по entity.full_name.
 */
export const extractFullName = (compositeId: string): string => {
	return parseEntityCompositeId(compositeId).fullName;
};

/**
 * Извлекает system_code из composite id.
 */
export const extractSystemCode = (compositeId: string): string => {
	return parseEntityCompositeId(compositeId).systemCode;
};

/**
 * Проверяет, содержит ли id system_code суффикс.
 */
export const hasSystemCodeSuffix = (id: string): boolean => {
	const lastDotIndex = id.lastIndexOf(SYSTEM_CODE_SEPARATOR);
	if (lastDotIndex === -1) return false;
	const possibleCode = id.substring(lastDotIndex + 1);
	return /^\d[\d_]{0,31}$/.test(possibleCode);
};
