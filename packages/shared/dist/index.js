"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devalueDeserialize = exports.devalueSerialize = exports.isValidJson = exports.jsonClone = exports.jsonCompare = exports.safeJsonStringify = exports.safeJsonParse = exports.fastStringify = exports.fastParse = exports.jsonUtil = void 0;
const { jsonUtil, fastParse, fastStringify, safeJsonParse, safeJsonStringify, jsonCompare, jsonClone, isValidJson, devalueSerialize, devalueDeserialize } = require('./utils/json');
exports.jsonUtil = jsonUtil;
exports.fastParse = fastParse;
exports.fastStringify = fastStringify;
exports.safeJsonParse = safeJsonParse;
exports.safeJsonStringify = safeJsonStringify;
exports.jsonCompare = jsonCompare;
exports.jsonClone = jsonClone;
exports.isValidJson = isValidJson;
exports.devalueSerialize = devalueSerialize;
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
    devalueDeserialize
};
//# sourceMappingURL=index.js.map