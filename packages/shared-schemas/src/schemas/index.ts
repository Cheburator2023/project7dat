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

// Export commit changes types
export * from './commit-changes.types';
export type {
  CommitChanges,
  CommitWithChanges,
  EntityChanges,
  MappingChanges,
  ChangesSummary,
  AddedEntity,
  RemovedEntity,
  ModifiedEntity,
  AddedMapping,
  RemovedMapping,
  ModifiedMapping,
  FieldChange,
  ChangeType,
} from './commit-changes.types';
