// ES Module version of json utilities
// Using fallback implementation for fast-json-stringify to avoid dynamic imports
const fastJsonStringify = (schema) => {
  // Simple fallback that just uses JSON.stringify
  return (value) => JSON.stringify(value);
};

// Fallback implementations for ES module compatibility
const devalueStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    throw new Error('Cannot stringify value');
  }
};

const devalueParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON');
  }
};

const superjson = {
  parse: (text) => {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON');
    }
  },
  stringify: (value) => {
    try {
      return JSON.stringify(value);
    } catch {
      throw new Error('Cannot stringify value');
    }
  }
};

class JsonUtility {
  constructor() {
    this.parseCache = new Map();
    this.stringifyCache = new Map();
  }

  parse(text, options = {}) {
    const { safe = false, preserveTypes = false } = options;
    
    try {
      if (preserveTypes) {
        return superjson.parse(text);
      }
      
      if (safe) {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      }
      
      return JSON.parse(text);
    } catch (error) {
      if (safe) return null;
      throw error;
    }
  }

  stringify(value, options = {}) {
    const { space, replacer, schema, preserveTypes = false } = options;
    
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
    } catch (error) {
      throw new Error(`Stringify failed: ${error.message}`);
    }
  }

  serialize(value) {
    try {
      return devalueStringify(value);
    } catch {
      try {
        return superjson.stringify(value);
      } catch {
        return this.stringify(value, { preserveTypes: true });
      }
    }
  }

  deserialize(text) {
    try {
      return devalueParse(text);
    } catch {
      try {
        return superjson.parse(text);
      } catch {
        return this.parse(text, { preserveTypes: true });
      }
    }
  }

  compare(a, b) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }

  clone(value) {
    try {
      return this.parse(this.stringify(value));
    } catch {
      return structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
    }
  }

  isValidJson(text) {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  clearCache() {
    this.parseCache.clear();
    this.stringifyCache.clear();
  }

  getCacheSize() {
    return {
      parseCache: this.parseCache.size,
      stringifyCache: this.stringifyCache.size
    };
  }
}

const jsonUtil = new JsonUtility();

const fastParse = (text, options) => 
  jsonUtil.parse(text, options);

const fastStringify = (value, options) => 
  jsonUtil.stringify(value, options);

const safeJsonParse = (text, fallback) => {
  try {
    return jsonUtil.parse(text);
  } catch {
    return fallback;
  }
};

const safeJsonStringify = (value, fallback = '{}') => {
  try {
    return jsonUtil.stringify(value);
  } catch {
    return fallback;
  }
};

const jsonCompare = (a, b) => jsonUtil.compare(a, b);
const jsonClone = (value) => jsonUtil.clone(value);
const isValidJson = (text) => jsonUtil.isValidJson(text);

const devalueSerialize = (value) => {
  try {
    return devalueStringify(value);
  } catch (error) {
    throw new Error(`Devalue serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const devalueDeserialize = (text) => {
  try {
    return devalueParse(text);
  } catch (error) {
    throw new Error(`Devalue deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export { jsonUtil, fastParse, fastStringify, safeJsonParse, safeJsonStringify, jsonCompare, jsonClone, isValidJson, devalueSerialize, devalueDeserialize, superjson, devalueStringify, devalueParse };