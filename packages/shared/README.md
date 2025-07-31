# Shared Utilities Package

## JSON Optimization

This package provides optimized JSON parsing and stringification utilities that replace the standard `JSON.parse()` and `JSON.stringify()` methods across the codebase.

### Libraries Used

- **SuperJSON** <mcreference link="https://www.npmjs.com/package/superjson" index="1">1</mcreference>: Safely serialize JavaScript expressions to a superset of JSON, preserving types like Date, BigInt, and more
- **fast-json-stringify** <mcreference link="https://www.npmjs.com/package/fast-json-stringify" index="2">2</mcreference>: Significantly faster than JSON.stringify() for small payloads when using JSON Schema
- **devalue** <mcreference link="https://github.com/Rich-Harris/devalue" index="3">3</mcreference>: Efficient serialization that handles circular references and complex objects

### Performance Benefits

- **2-10x faster** JSON stringification for structured data <mcreference link="https://www.npmjs.com/package/fast-json-stringify" index="2">2</mcreference>
- **Type-safe** parsing and stringification with SuperJSON <mcreference link="https://www.npmjs.com/package/superjson" index="1">1</mcreference>
- **Memory efficient** operations with optimized algorithms
- **Caching** for schema-based stringification
- **Safe fallbacks** for error handling

### API Reference

#### Basic Functions

```typescript
import { fastParse, fastStringify, safeJsonParse, safeJsonStringify } from '@data-lineage/shared/utils/json';

// Fast parsing with error handling
const data = fastParse<MyType>(jsonString);

// Fast stringification with options
const json = fastStringify(data, { space: 2 });

// Safe parsing with fallback
const data = safeJsonParse(jsonString, defaultValue);

// Safe stringification with fallback
const json = safeJsonStringify(data, '{}');
```

#### Advanced Functions

```typescript
import { jsonClone, jsonCompare, jsonUtil } from '@data-lineage/shared/utils/json';

// Deep clone objects efficiently
const cloned = jsonClone(originalObject);

// Compare objects for equality
const isEqual = jsonCompare(obj1, obj2);

// Type-preserving serialization
const serialized = jsonUtil.serialize(complexObject);
const deserialized = jsonUtil.deserialize(serialized);
```

#### Schema-based Optimization

```typescript
import { fastStringify } from '@data-lineage/shared/utils/json';

// Define JSON Schema for your data structure
const schema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    age: { type: 'number' }
  }
};

// Use schema for optimized stringification
const json = fastStringify(userData, { schema });
```

### Options

#### JsonParseOptions
- `safe?: boolean` - Enable error handling (default: true)
- `preserveTypes?: boolean` - Use SuperJSON for type preservation
- `reviver?: (key: string, value: any) => any` - Custom reviver function

#### JsonStringifyOptions
- `safe?: boolean` - Enable error handling (default: true)
- `preserveTypes?: boolean` - Use SuperJSON for type preservation
- `schema?: object` - JSON Schema for optimization
- `replacer?: (key: string, value: any) => any` - Custom replacer function
- `space?: string | number` - Indentation for pretty printing

### Migration Guide

Replace standard JSON operations:

```typescript
// Before
const data = JSON.parse(jsonString);
const json = JSON.stringify(data, null, 2);
const isEqual = JSON.stringify(a) === JSON.stringify(b);
const cloned = JSON.parse(JSON.stringify(original));

// After
const data = fastParse(jsonString);
const json = fastStringify(data, { space: 2 });
const isEqual = jsonCompare(a, b);
const cloned = jsonClone(original);
```

### Cache Management

```typescript
import { jsonUtil } from '@data-lineage/shared/utils/json';

// Clear schema cache
jsonUtil.clearCache();

// Get cache size
const cacheSize = jsonUtil.getCacheSize();
```

### Error Handling

All functions include built-in error handling:

- `safe: true` (default): Throws descriptive errors
- `safe: false`: Throws original errors
- Safe variants return fallback values on error

### Type Safety

Full TypeScript support with generic types:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const user = fastParse<User>(jsonString);
const users = fastParse<User[]>(jsonArrayString);
```

### Performance Considerations

1. **Schema-based stringification** is most beneficial for repeated operations on similar data structures
2. **SuperJSON** adds overhead but provides type safety and handles complex objects
3. **Caching** improves performance for repeated schema-based operations
4. **Safe variants** have minimal overhead for error handling

### Compatibility

- Node.js 16+
- Modern browsers with ES2020 support
- TypeScript 4.5+
- React 18+