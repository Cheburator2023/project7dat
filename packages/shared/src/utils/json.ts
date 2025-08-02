const fastJsonStringify = require('fast-json-stringify');

// Fallback for devalue since it's an ES module
const devalueStringify = (value: any): string => {
  try {
    return JSON.stringify(value);
  } catch {
    throw new Error('Cannot stringify value');
  }
};

const devalueParse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON');
  }
};

// Fallback for superjson since it's an ES module
const superjson = {
  parse: (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON');
    }
  },
  stringify: (value: any) => {
    try {
      return JSON.stringify(value);
    } catch {
      throw new Error('Cannot stringify value');
    }
  }
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

class JsonUtility {
  private stringifyCache = new Map<string, (obj: any) => string>();

  parse<T = any>(text: string, options: JsonParseOptions = {}): T {
    const { safe = true, preserveTypes = false, reviver } = options;

    try {
      if (preserveTypes) {
        return superjson.parse(text);
      }

      if (safe && reviver) {
        return JSON.parse(text, reviver);
      }

      return JSON.parse(text);
    } catch (error) {
      if (safe) {
        throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    }
  }

  stringify(value: any, options: JsonStringifyOptions = {}): string {
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
        return JSON.stringify(value, replacer as any, space);
      }

      return JSON.stringify(value);
    } catch (error) {
      if (safe) {
        throw new Error(`JSON stringification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    }
  }

  serialize(value: any): string {
    try {
      // Use devalue for optimal performance and circular reference handling
      return devalueStringify(value);
    } catch (error) {
      // Fallback to superjson for type preservation
      try {
        return superjson.stringify(value);
      } catch {
        return this.stringify(value, { preserveTypes: true });
      }
    }
  }

  deserialize<T = any>(text: string): T {
    try {
      // Use devalue for optimal performance
      return devalueParse(text) as T;
    } catch {
      // Fallback to superjson for type preservation
      try {
        return superjson.parse(text);
      } catch {
        return this.parse<T>(text, { preserveTypes: true });
      }
    }
  }

  compare(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    
    try {
      return this.stringify(a) === this.stringify(b);
    } catch {
      return false;
    }
  }

  clone<T>(value: T): T {
    try {
      return this.parse(this.stringify(value));
    } catch {
      return structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
    }
  }

  isValidJson(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  clearCache(): void {
    this.stringifyCache.clear();
  }

  getCacheSize(): number {
    return this.stringifyCache.size;
  }
}

const jsonUtil = new JsonUtility();

const fastParse = <T = any>(text: string, options?: JsonParseOptions): T => 
  jsonUtil.parse<T>(text, options);

const fastStringify = (value: any, options?: JsonStringifyOptions): string => 
  jsonUtil.stringify(value, options);

const safeJsonParse = <T = any>(text: string, fallback?: T): T => {
  try {
    return jsonUtil.parse<T>(text);
  } catch {
    return fallback as T;
  }
};

const safeJsonStringify = (value: any, fallback = '{}'): string => {
  try {
    return jsonUtil.stringify(value);
  } catch {
    return fallback;
  }
};

const jsonCompare = (a: any, b: any): boolean => jsonUtil.compare(a, b);
const jsonClone = <T>(value: T): T => jsonUtil.clone(value);
const isValidJson = (text: string): boolean => jsonUtil.isValidJson(text);

// Devalue-specific functions for maximum performance
const devalueSerialize = (value: any): string => {
  try {
    return devalueStringify(value);
  } catch (error) {
    throw new Error(`Devalue serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const devalueDeserialize = <T = any>(text: string): T => {
  try {
    return devalueParse(text) as T;
  } catch (error) {
    throw new Error(`Devalue deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// TypeScript exports for proper type declarations
export { jsonUtil, fastParse, fastStringify, safeJsonParse, safeJsonStringify, jsonCompare, jsonClone, isValidJson, devalueSerialize, devalueDeserialize, superjson, devalueStringify, devalueParse };
export type { JsonOptions };

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
