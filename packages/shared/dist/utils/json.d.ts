declare const devalueStringify: (value: any) => string;
declare const devalueParse: (text: string) => any;
declare const superjson: {
    parse: (text: string) => any;
    stringify: (value: any) => string;
};
interface JsonOptions {
    safe?: boolean;
    preserveTypes?: boolean;
    schema?: object;
}
export interface JsonParseOptions extends JsonOptions {
    reviver?: (key: string, value: any) => any;
}
export interface JsonStringifyOptions extends JsonOptions {
    replacer?: (key: string, value: any) => any;
    space?: string | number;
}
declare class JsonUtility {
    private stringifyCache;
    parse<T = any>(text: string, options?: JsonParseOptions): T;
    stringify(value: any, options?: JsonStringifyOptions): string;
    serialize(value: any): string;
    deserialize<T = any>(text: string): T;
    compare(a: any, b: any): boolean;
    clone<T>(value: T): T;
    isValidJson(text: string): boolean;
    clearCache(): void;
    getCacheSize(): number;
}
declare const jsonUtil: JsonUtility;
declare const fastParse: <T = any>(text: string, options?: JsonParseOptions) => T;
declare const fastStringify: (value: any, options?: JsonStringifyOptions) => string;
declare const safeJsonParse: <T = any>(text: string, fallback?: T) => T;
declare const safeJsonStringify: (value: any, fallback?: string) => string;
declare const jsonCompare: (a: any, b: any) => boolean;
declare const jsonClone: <T>(value: T) => T;
declare const isValidJson: (text: string) => boolean;
declare const devalueSerialize: (value: any) => string;
declare const devalueDeserialize: <T = any>(text: string) => T;
export { jsonUtil, fastParse, fastStringify, safeJsonParse, safeJsonStringify, jsonCompare, jsonClone, isValidJson, devalueSerialize, devalueDeserialize, superjson, devalueStringify, devalueParse };
export type { JsonOptions };
//# sourceMappingURL=json.d.ts.map