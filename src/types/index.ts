/**
 * @fileoverview
 * This file serves as the central hub for all core type definitions and interfaces used across the application.
 * It establishes the data contracts for entities like `User`, defines a generic `Repository` pattern for
 * data access, and specifies the structures for service options and results, such as for migration.
 * Centralizing these types ensures consistency and type safety throughout the codebase.
 */

/**
 * @interface User
 * @description Represents the core user entity within the application.
 *              This interface defines the fundamental data structure for a user,
 *              which is used in repositories, services, and data generation.
 *
 * @property {string} id - The unique identifier for the user, typically a UUID.
 * @property {string} firstName - The user's given name.
 * @property {string} lastName - The user's family name.
 * @property {number} age - The user's age in years.
 * @property {number} followersCount - The number of followers the user has, used for sorting or filtering.
 * @property {string} timestamp - ISO timestamp indicating when the record was generated
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  followersCount: number;
  timestamp: string;
}

/**
 * @interface UserMapping
 * @description Defines the explicit Elasticsearch mapping for the `User` entity.
 * @summary This structure is provided to Elasticsearch during index creation to ensure each `User`
 *          field is indexed correctly (e.g., `id` as a non-analyzed `keyword` for exact matches,
 *          names as `text` for full-text search, and numeric fields as `integer`).
 *          This is crucial for search performance and accuracy.
 *
 * @property {object} properties - A container for the field-specific mapping definitions.
 */
export interface UserMapping {
  properties: {
    id: { type: "keyword" };
    firstName: { type: "text" };
    lastName: { type: "text" };
    age: { type: "integer" };
    followersCount: { type: "integer" };
    timestamp: { type: "date" };
  };
}

/**
 * @interface Repository<T>
 * @description Defines a generic contract for a data repository, abstracting the underlying data source logic.
 * @summary This interface establishes a standard set of data manipulation methods that any repository implementation
 *          (e.g., `ElasticsearchUserRepository`, `ClickHouseUserRepository`) must adhere to. This promotes a
 *          consistent data access pattern and allows services to be decoupled from specific database technologies.
 *
 * @template T - The entity type that the repository will manage (e.g., `User`).
 */
export interface Repository<T> {
  /**
   * @method exists
   * @description Checks if the underlying data store (e.g., an index or a table) exists.
   * @returns {Promise<boolean>} A promise resolving to `true` if the store exists, otherwise `false`.
   * @memberof Repository
   * @signature `exists(): Promise<boolean>`
   */
  exists(): Promise<boolean>;

  /**
   * @method create
   * @description Creates and initializes the data store.
   * @summary This method is responsible for setting up the necessary infrastructure for the data,
   *          such as creating a table with a specific schema or an index with a specific mapping.
   * @returns {Promise<void>} A promise that resolves upon successful creation.
   * @memberof Repository
   * @signature `create(): Promise<void>`
   */
  create(): Promise<void>;

  /**
   * @method clear
   * @description Permanently deletes all records from the data store.
   * @summary This is a destructive operation intended to completely reset the repository to an empty state.
   * @returns {Promise<void>} A promise that resolves once the store is cleared.
   * @memberof Repository
   * @signature `clear(): Promise<void>`
   */
  clear(): Promise<void>;

  /**
   * @method insert
   * @description Inserts a batch of items into the data store.
   * @param {T[]} items - An array of items to be saved.
   * @returns {Promise<void>} A promise that resolves when the insertion operation is complete.
   * @memberof Repository
   * @signature `insert(items: T[]): Promise<void>`
   */
  insert(items: T[]): Promise<void>;

  /**
   * @method count
   * @description Calculates and returns the total number of records in the data store.
   * @returns {Promise<number>} A promise resolving to the total count of items.
   * @memberof Repository
   * @signature `count(): Promise<number>`
   */
  count(): Promise<number>;

  /**
   * @method findAll
   * @description Retrieves all records from the data store using a memory-efficient async generator.
   * @summary This method is designed to handle large datasets by streaming records in batches,
   *          preventing high memory usage that would occur from loading all records at once.
   *
   * @param {number} [batchSize=1000] - The desired number of items in each batch.
   * @returns {AsyncGenerator<T[]>} An async generator that yields arrays (batches) of items.
   * @memberof Repository
   * @signature `findAll(batchSize?: number): AsyncGenerator<T[]>`
   */
  findAll(batchSize?: number): AsyncGenerator<T[], void, unknown>;

  /**
   * @method getSample
   * @description Fetches a small, limited sample of records from the data store.
   * @summary This is useful for quick data validation, debugging, or displaying a preview.
   * @param {number} count - The number of sample records to retrieve.
   * @returns {Promise<T[]>} A promise resolving to an array of sample items.
   * @memberof Repository
   * @signature `getSample(count: number): Promise<T[]>`
   */
  getSample(count: number): Promise<T[]>;

  /**
   * @method findByIds
   * @description Fetches a set of records from the data store that match the given IDs.
   * @param {string[]} ids - An array of IDs to retrieve.
   * @returns {Promise<T[]>} A promise resolving to an array of items matching the IDs.
   * @memberof Repository
   * @signature `findByIds(ids: string[]): Promise<T[]>`
   */
  findByIds(ids: string[]): Promise<T[]>;
}

/**
 * @type ProgressCallback
 * @description A callback function type used for reporting progress in long-running operations.
 * @param {number} processed - The number of items processed so far.
 * @param {number} [total] - The total number of items to process (if known).
 */
export type ProgressCallback = (processed: number, total?: number) => void;

/**
 * @interface MigrationOptions
 * @description Defines the configuration options for a data migration process.
 *
 * @property {number} [batchSize=1000] - The number of records to transfer in each batch to manage memory and load.
 * @property {ProgressCallback} [onProgress] - An optional callback function that is invoked after each batch
 *                                             is processed, allowing for real-time progress monitoring.
 */
export interface MigrationOptions {
  batchSize?: number;
  onProgress?: ProgressCallback;
}

/**
 * @interface MigrationResult
 * @description Encapsulates the summary and outcome of a completed migration process.
 *
 * @property {number} sourceCount - The total number of records that were in the source repository before migration.
 * @property {number} targetCount - The total number of records in the target repository after the migration.
 * @property {boolean} success - Indicates whether the migration was successful, typically determined by `sourceCount === targetCount`.
 * @property {number} durationMs - The total time taken for the migration, in milliseconds.
 */
export interface MigrationResult {
  sourceCount: number;
  targetCount: number;
  success: boolean;
  durationMs: number;
}
