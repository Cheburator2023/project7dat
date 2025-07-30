# Data Lineage Shared Schemas Usage Guide

This package provides a single source of truth for data lineage schemas used across both backend and frontend applications.

## Installation

The package is already configured as a workspace dependency. Import directly from source:

```typescript
import { 
  DataLineageSchema,
  DataLineageEntity,
  dataLineageJsonSchema,
  isDataLineageSchema 
} from '@data-lineage/shared-schemas';
```

## Available Types

### Core Schema Types

- `DataLineageSchema` - Complete data lineage structure
- `DataLineageEntity` - Individual entity (table/view)
- `DataLineageAttribute` - Entity attribute
- `DataLineageMapping` - Entity mapping information
- `DataLineageDependency` - Dependency between entities
- `DataLineageAppDescription` - Application metadata

### Utility Types

- `DataLineageLinkType` - Link types: 'window' | 'join' | 'where' | 'groupby'
- `DataLineageEntityType` - Entity types: 'table' | 'view'

### JSON Schema

- `dataLineageSchema` - Raw JSON schema object
- `dataLineageJsonSchema` - Typed JSON Schema (JSONSchema7)

### Type Guards

- `isDataLineageSchema(data)` - Validates complete schema
- `isDataLineageEntity(data)` - Validates entity structure

## Backend Usage (NestJS)

### Schema Validation

```typescript
// apps/nestjs-server/src/schemas/json-data.schema.ts
import { DataLineageSchema } from '@data-lineage/shared-schemas';
import { z } from 'zod';

// Zod schema for validation
export const DataLineageZodSchema = z.object({
  desc: z.object({
    appId: z.string(),
    appName: z.string(),
  }),
  entities: z.array(z.object({
    id: z.string(),
    modified: z.boolean(),
    type: z.enum(["table", "view"]),
    name: z.string(),
    // ... other fields
  })),
  mappings: z.array(z.object({
    id: z.number(),
    entityId: z.string(),
    // ... other fields
  })),
});

// Use in API endpoints
export const CreateJsonDataSchema = z.object({
  data: DataLineageZodSchema,
  name: z.string().optional(),
  description: z.string().optional(),
});
```

### Service Implementation

```typescript
// apps/nestjs-server/src/services/json-data.service.ts
import { DataLineageSchema, isDataLineageSchema } from '@data-lineage/shared-schemas';

@Injectable()
export class JsonDataService {
  async createGraph(data: DataLineageSchema): Promise<JsonDataEntity> {
    // Validate using type guard
    if (!isDataLineageSchema(data)) {
      throw new BadRequestException('Invalid data lineage schema');
    }
    
    // Process entities
    const entities = data.entities.map(entity => {
      // Type-safe access to entity properties
      return {
        id: entity.id,
        name: entity.name,
        type: entity.type, // 'table' | 'view'
        modified: entity.modified,
        attributes: entity.attrSeq || []
      };
    });
    
    // Save to database...
  }
}
```

## Frontend Usage (React)

### API Types

```typescript
// apps/react-client/src/api/jsonDataApi.ts
import { DataLineageSchema } from '@data-lineage/shared-schemas';

export interface JsonDataItem {
  id: string;
  name: string;
  data: DataLineageSchema; // Type-safe data structure
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJsonDataRequest {
  data: DataLineageSchema;
  name?: string;
  description?: string;
}
```

### Component Usage

```typescript
// apps/react-client/src/components/DataLineageViewer.tsx
import { 
  DataLineageSchema, 
  DataLineageEntity,
  isDataLineageSchema 
} from '@data-lineage/shared-schemas';

interface Props {
  data: DataLineageSchema;
}

export const DataLineageViewer: React.FC<Props> = ({ data }) => {
  // Type-safe access to schema properties
  const { desc, entities, mappings } = data;
  
  // Validate data at runtime
  if (!isDataLineageSchema(data)) {
    return <div>Invalid data lineage schema</div>;
  }
  
  return (
    <div>
      <h2>{desc.appName} ({desc.appId})</h2>
      
      {/* Render entities with full type safety */}
      {entities.map((entity: DataLineageEntity) => (
        <div key={entity.id}>
          <h3>{entity.name}</h3>
          <p>Type: {entity.type}</p> {/* 'table' | 'view' */}
          <p>Modified: {entity.modified ? 'Yes' : 'No'}</p>
          
          {/* Render attributes */}
          {entity.attrSeq?.map(attr => (
            <div key={attr.name}>
              {attr.name}: {attr.type}
              {attr.comment && <span> - {attr.comment}</span>}
            </div>
          ))}
        </div>
      ))}
      
      {/* Render mappings */}
      {mappings.map(mapping => (
        <div key={mapping.id}>
          <h4>Mapping {mapping.id}: {mapping.entityId}</h4>
          {/* Type-safe mapping rendering */}
        </div>
      ))}
    </div>
  );
};
```

### Store Integration

```typescript
// apps/react-client/src/stores/dataLineageStore.ts
import { DataLineageSchema, DataLineageEntity } from '@data-lineage/shared-schemas';
import { create } from 'zustand';

interface DataLineageState {
  currentSchema: DataLineageSchema | null;
  entities: DataLineageEntity[];
  setSchema: (schema: DataLineageSchema) => void;
  getEntitiesByType: (type: 'table' | 'view') => DataLineageEntity[];
}

export const useDataLineageStore = create<DataLineageState>((set, get) => ({
  currentSchema: null,
  entities: [],
  
  setSchema: (schema: DataLineageSchema) => {
    set({ 
      currentSchema: schema, 
      entities: schema.entities 
    });
  },
  
  getEntitiesByType: (type: 'table' | 'view') => {
    return get().entities.filter(entity => entity.type === type);
  },
}));
```

## JSON Schema Validation

The package also exports the raw JSON schema for validation in other contexts:

```typescript
import { dataLineageJsonSchema } from '@data-lineage/shared-schemas';
import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile(dataLineageJsonSchema);

const isValid = validate(someData);
if (!isValid) {
  console.log(validate.errors);
}
```

## Benefits

1. **Single Source of Truth**: Schema defined once in JSON, types generated automatically
2. **Type Safety**: Full TypeScript support across backend and frontend
3. **Runtime Validation**: Type guards for runtime schema validation
4. **No Build Step**: Direct import from source files
5. **Consistency**: Same types used everywhere, preventing drift
6. **IDE Support**: Full autocomplete and error checking

## Schema Structure

The data lineage schema follows this structure:

```typescript
interface DataLineageSchema {
  desc: {
    appId: string;        // Spark application ID
    appName: string;      // Spark application name
  };
  entities: Array<{       // Data entities (tables/views)
    id: string;           // Entity identifier
    modified: boolean;    // true = target, false = source
    type: 'table' | 'view';
    namespace?: string;   // Schema name
    name: string;         // Entity name
    attrSeq?: Array<{     // Attributes/columns
      name: string;
      type: string;
      comment?: string;
    }>;
  }>;
  mappings: Array<{       // Entity relationships
    id: number;           // Mapping sequence
    entityId: string;     // Target entity
    deps?: Array<{        // Dependencies
      entityId: string;   // Source entity
      attrMaps?: Array<{  // Attribute mappings
        src: string;      // Source attribute
        dst: string;      // Target attribute
      }>;
      atrDeps?: Array<{   // Attribute dependencies
        attr: string;     // Source attribute
        linkTypes?: Array<'window' | 'join' | 'where' | 'groupby'>;
      }>;
    }>;
    unmatched?: Array<any>; // Unmatched entities
  }>;
}
```