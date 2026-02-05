import { JSONSchema7 } from 'json-schema';
import dataLineageSchema from './dataLineageSchema.json';

// Type definitions generated from JSON Schema
export interface DataLineageSchema {
  desc: {
    appId: string;
    appName: string;
  };
  entities: DataLineageEntity[];
  mappings: DataLineageMapping[];
  failedMappings: DataLineageMapping[];
}

// Entity type for individual entities
export interface DataLineageEntity {
  id: string;
  modified: boolean;
  type: 'table' | 'view' | 'rdd' | 'unresolved' | 'input_vector';
  namespace?: string;
  name: string | null;
  entity_change?: string;
  description?: string;
  
  attrSeq?: Array<{
    name: string;
    type: string;
    comment?: string;
  }>;
}

// Attribute type
export interface DataLineageAttribute {
  name: string;
  type: string;
  comment?: string;
}

// Mapping type
export interface DataLineageMapping {
  id: number;
  entityId: string;
  deps?: Array<{
    entityId: string;
    attrMaps?: Array<{
      src: string;
      dst: string;
    }>;
    atrDeps?: Array<{
      attr: string;
      linkTypes?: Array<'window' | 'join' | 'where' | 'groupby'>;
    }>;
  }>;
  unmatched?: Array<any>;
}

// Dependency type
export interface DataLineageDependency {
  entityId: string;
  attrMaps?: Array<{
    src: string;
    dst: string;
  }>;
  atrDeps?: Array<{
    attr: string;
    linkTypes?: Array<'window' | 'join' | 'where' | 'groupby'>;
  }>;
}

// Attribute mapping type
export interface DataLineageAttributeMapping {
  src: string;
  dst: string;
}

// Attribute dependency type
export interface DataLineageAttributeDependency {
  attr: string;
  linkTypes?: Array<'window' | 'join' | 'where' | 'groupby'>;
}

// Application description type
export interface DataLineageAppDescription {
  appId: string;
  appName: string;
}

// Link types enum
export type DataLineageLinkType = 'window' | 'join' | 'where' | 'groupby';

// Entity types enum
export type DataLineageEntityType = 'table' | 'view';

// Export the JSON schema as well
export const dataLineageJsonSchema: JSONSchema7 = dataLineageSchema as JSONSchema7;

// Type guard functions
export const isDataLineageSchema = (data: any): data is DataLineageSchema => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.desc === 'object' &&
    typeof data.desc.appId === 'string' &&
    typeof data.desc.appName === 'string' &&
    Array.isArray(data.entities) &&
    Array.isArray(data.mappings)
  );
};

export const isDataLineageEntity = (data: any): data is DataLineageEntity => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.modified === 'boolean' &&
    (data.type === 'table' || data.type === 'view') &&
    typeof data.name === 'string'
  );
};