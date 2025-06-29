/**
 * Represents a user document.
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  followersCount: number;
}

/**
 * Elasticsearch mapping for User.
 */
export interface UserMapping {
  properties: {
    id: { type: "keyword" };
    firstName: { type: "text" };
    lastName: { type: "text" };
    age: { type: "integer" };
    followersCount: { type: "integer" };
  };
}

/**
 * Generic repository interface.
 */
export interface Repository<T> {
  exists(): Promise<boolean>;
  create(): Promise<void>;
  clear(): Promise<void>;
  insert(items: T[]): Promise<void>;
  count(): Promise<number>;
  findAll(batchSize?: number): AsyncGenerator<T[], void, unknown>;
}

/**
 * Migration progress callback.
 */
export type ProgressCallback = (processed: number, total?: number) => void;

/**
 * Migration options.
 */
export interface MigrationOptions {
  batchSize?: number;
  onProgress?: ProgressCallback;
}

/**
 * Migration result.
 */
export interface MigrationResult {
  sourceCount: number;
  targetCount: number;
  success: boolean;
  durationMs: number;
}
