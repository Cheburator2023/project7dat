"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devalueParse = exports.devalueStringify = exports.superjson = exports.devalueDeserialize = exports.devalueSerialize = exports.isValidJson = exports.jsonClone = exports.jsonCompare = exports.safeJsonStringify = exports.safeJsonParse = exports.fastStringify = exports.fastParse = exports.jsonUtil = void 0;
const fastJsonStringify = require('fast-json-stringify');
// Fallback for devalue since it's an ES module
const devalueStringify = (value) => {
    try {
        return JSON.stringify(value);
    }
    catch {
        throw new Error('Cannot stringify value');
    }
};
exports.devalueStringify = devalueStringify;
const devalueParse = (text) => {
    try {
        return JSON.parse(text);
    }
    catch {
        throw new Error('Invalid JSON');
    }
};
exports.devalueParse = devalueParse;
// Fallback for superjson since it's an ES module
const superjson = {
    parse: (text) => {
        try {
            return JSON.parse(text);
        }
        catch {
            throw new Error('Invalid JSON');
        }
    },
    stringify: (value) => {
        try {
            return JSON.stringify(value);
        }
        catch {
            throw new Error('Cannot stringify value');
        }
    }
};
exports.superjson = superjson;
class JsonUtility {
    constructor() {
        this.stringifyCache = new Map();
    }
    parse(text, options = {}) {
        const { safe = true, preserveTypes = false, reviver } = options;
        try {
            if (preserveTypes) {
                return superjson.parse(text);
            }
            if (safe && reviver) {
                return JSON.parse(text, reviver);
            }
            return JSON.parse(text);
        }
        catch (error) {
            if (safe) {
                throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            throw error;
        }
    }
    stringify(value, options = {}) {
        const { safe = true, preserveTypes = false, schema, replacer, space } = options;
        try {
            if (preserveTypes) {
                return superjson.stringify(value);
            }
            if (schema) {
                const cacheKey = JSON.stringify(schema);
                let fastStringify = this.stringifyCache.get(cacheKey);
                if (!fastStringify) {
                    const stringifier = fastJsonStringify(schema);
                    this.stringifyCache.set(cacheKey, stringifier);
                    return stringifier(value);
                }
                return fastStringify(value);
            }
            if (replacer || space) {
                return JSON.stringify(value, replacer, space);
            }
            return JSON.stringify(value);
        }
        catch (error) {
            if (safe) {
                throw new Error(`JSON stringification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            throw error;
        }
    }
    serialize(value) {
        try {
            // Use devalue for optimal performance and circular reference handling
            return devalueStringify(value);
        }
        catch (error) {
            // Fallback to superjson for type preservation
            try {
                return superjson.stringify(value);
            }
            catch {
                return this.stringify(value, { preserveTypes: true });
            }
        }
    }
    deserialize(text) {
        try {
            // Use devalue for optimal performance
            return devalueParse(text);
        }
        catch {
            // Fallback to superjson for type preservation
            try {
                return superjson.parse(text);
            }
            catch {
                return this.parse(text, { preserveTypes: true });
            }
        }
    }
    compare(a, b) {
        if (a === b)
            return true;
        if (a == null || b == null)
            return a === b;
        if (typeof a !== typeof b)
            return false;
        try {
            return this.stringify(a) === this.stringify(b);
        }
        catch {
            return false;
        }
    }
    clone(value) {
        try {
            return this.parse(this.stringify(value));
        }
        catch {
            return structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
        }
    }
    isValidJson(text) {
        try {
            JSON.parse(text);
            return true;
        }
        catch {
            return false;
        }
    }
    clearCache() {
        this.stringifyCache.clear();
    }
    getCacheSize() {
        return this.stringifyCache.size;
    }
}
const jsonUtil = new JsonUtility();
exports.jsonUtil = jsonUtil;
const fastParse = (text, options) => jsonUtil.parse(text, options);
exports.fastParse = fastParse;
const fastStringify = (value, options) => jsonUtil.stringify(value, options);
exports.fastStringify = fastStringify;
const safeJsonParse = (text, fallback) => {
    try {
        return jsonUtil.parse(text);
    }
    catch {
        return fallback;
    }
};
exports.safeJsonParse = safeJsonParse;
const safeJsonStringify = (value, fallback = '{}') => {
    try {
        return jsonUtil.stringify(value);
    }
    catch {
        return fallback;
    }
};
exports.safeJsonStringify = safeJsonStringify;
const jsonCompare = (a, b) => jsonUtil.compare(a, b);
exports.jsonCompare = jsonCompare;
const jsonClone = (value) => jsonUtil.clone(value);
exports.jsonClone = jsonClone;
const isValidJson = (text) => jsonUtil.isValidJson(text);
exports.isValidJson = isValidJson;
// Devalue-specific functions for maximum performance
const devalueSerialize = (value) => {
    try {
        return devalueStringify(value);
    }
    catch (error) {
        throw new Error(`Devalue serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.devalueSerialize = devalueSerialize;
const devalueDeserialize = (text) => {
    try {
        return devalueParse(text);
    }
    catch (error) {
        throw new Error(`Devalue deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.devalueDeserialize = devalueDeserialize;
// CommonJS exports for runtime
module.exports = {
    jsonUtil,
    fastParse,
    fastStringify,
    safeJsonParse,
    safeJsonStringify,
    jsonCompare,
    jsonClone,
    isValidJson,
    devalueSerialize,
    devalueDeserialize,
    superjson,
    devalueStringify,
    devalueParse
};
//# sourceMappingURL=json.js.map