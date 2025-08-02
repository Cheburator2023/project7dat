import dataLineageSchema from "./dataLineageSchema.json";

// Export JSON schema
export { dataLineageSchema };

// Export TypeScript types
export * from './types';
export type {
  DataLineageSchema,
  DataLineageEntity,
  DataLineageAttribute,
  DataLineageMapping,
  DataLineageDependency,
  DataLineageAttributeMapping,
  DataLineageAttributeDependency,
  DataLineageAppDescription,
  DataLineageLinkType,
  DataLineageEntityType
} from './types';
