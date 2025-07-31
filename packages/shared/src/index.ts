const { jsonUtil, fastParse, fastStringify, safeJsonParse, safeJsonStringify, jsonCompare, jsonClone, isValidJson, devalueSerialize, devalueDeserialize } = require('./utils/json');

// TypeScript exports for proper type declarations
export { jsonUtil, fastParse, fastStringify, safeJsonParse, safeJsonStringify, jsonCompare, jsonClone, isValidJson, devalueSerialize, devalueDeserialize };

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
