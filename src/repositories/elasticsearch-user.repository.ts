/**
 * @fileoverview
 * This file defines the `ElasticsearchUserRepository`, which is responsible for managing user data
 * in an Elasticsearch index. It implements the generic `Repository` interface, providing a consistent
 * API for data operations like creating the index, inserting documents, and performing searches.
 * This class encapsulates all Elasticsearch-specific logic.
 */

import { Client as ElasticClient } from "@elastic/elasticsearch";
import { User, Repository, UserMapping } from "../types/index";
import { Logger } from "../utils/logger";

/**
 * @class ElasticsearchUserRepository
 * @implements {Repository<User>}
 * @description Manages all data operations for user documents within a specific Elasticsearch index.
 * @summary This class abstracts the complexities of the Elasticsearch client API for operations such as
 *          index creation with specific mappings, bulk data insertion, document counting, and efficient
 *          data retrieval using scrolling. It serves as the primary data access layer for user data
 *          stored in Elasticsearch.
 *
 * @responsibility
 * - Defining the schema (mapping) for user documents.
 * - Creating, deleting, and checking the existence of the user index.
 * - Inserting user documents in bulk.
 * - Clearing all documents from the index.
 * - Counting the total number of documents.
 * - Retrieving all users via a memory-efficient scroll search.
 * - Fetching a small sample of user documents.
 */
export class ElasticsearchUserRepository implements Repository<User> {
  /**
   * @private
   * @readonly
   * @property {UserMapping} mapping
   * @description Defines the Elasticsearch mapping for the `User` type. This schema specifies the data type
   *              for each field in the user document (e.g., `keyword` for IDs, `text` for names, `integer` for numbers).
   *              A well-defined mapping is crucial for efficient indexing and searching.
   */
  private readonly mapping: UserMapping = {
    properties: {
      id: { type: "keyword" },
      firstName: { type: "text" },
      lastName: { type: "text" },
      age: { type: "integer" },
      followersCount: { type: "integer" },
      timestamp: { type: "date" },
    },
  };

  /**
   * @constructor
   * @description Initializes a new instance of the `ElasticsearchUserRepository`.
   * @param {ElasticClient} client - An active Elasticsearch client instance for communicating with the cluster.
   * @param {string} indexName - The name of the Elasticsearch index this repository will manage.
   * @param {Logger} logger - A logger instance for recording events and errors.
   */
  constructor(private client: ElasticClient, private indexName: string, private logger: Logger) {}

  /**
   * @method exists
   * @description Checks if the configured Elasticsearch index exists.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the index exists, `false` otherwise.
   *
   * @signature `exists(): Promise<boolean>`
   * @responsibility To determine if the index is already present before attempting to create or delete it.
   */
  async exists(): Promise<boolean> {
    try {
      return await this.client.indices.exists({ index: this.indexName });
    } catch (error) {
      this.logger.error(`Error checking if index exists: ${error}`);
      throw error;
    }
  }

  /**
   * @method create
   * @description Creates the Elasticsearch index for users, applying the predefined mapping.
   * @summary This method first checks for the index's existence. If it exists, the index is deleted
   *          and then recreated. This destructive behavior is useful for setting up a clean environment
   *          for development, testing, or data seeding.
   *
   * @signature `create(): Promise<void>`
   * @responsibility To ensure the user index exists and is configured with the correct mapping.
   * @warning This is a destructive operation. It will delete all existing data in the index if it already exists.
   */
  async create(): Promise<void> {
    try {
      const indexExists = await this.exists();
      if (indexExists) {
        this.logger.info(`Index "${this.indexName}" already exists, deleting...`);
        await this.client.indices.delete({
          index: this.indexName,
          ignore_unavailable: true,
        });
      }

      this.logger.info(`Creating index "${this.indexName}" with mapping...`);
      await this.client.indices.create({
        index: this.indexName,
        mappings: this.mapping,
      });
      this.logger.info(`Index "${this.indexName}" created successfully`);
    } catch (error) {
      this.logger.error(`Error creating index: ${error}`);
      throw error;
    }
  }

  /**
   * @method clear
   * @description Deletes all data from the user index by deleting the index itself.
   * @summary This method provides a way to quickly clear all user data. Note that it deletes the index,
   *          so a subsequent `create()` call would be needed to use it again.
   *
   * @signature `clear(): Promise<void>`
   * @responsibility To completely remove the user index and all its data.
   */
  async clear(): Promise<void> {
    try {
      await this.client.indices.delete({
        index: this.indexName,
        ignore_unavailable: true,
      });
      this.logger.info(`Index "${this.indexName}" cleared`);
    } catch (error) {
      this.logger.error(`Error clearing index: ${error}`);
      throw error;
    }
  }

  /**
   * @method insert
   * @description Inserts an array of user documents into the Elasticsearch index using the efficient `bulk` API.
   * @param {User[]} users - An array of `User` objects to be indexed.
   * @returns {Promise<void>} A promise that resolves once the bulk operation is complete.
   *
   * @signature `insert(users: User[]): Promise<void>`
   * @responsibility To perform high-performance, batch indexing of user documents. It also handles logging
   *               of any potential errors that occur during the bulk operation.
   */
  async insert(users: User[]): Promise<void> {
    if (users.length === 0) return;

    try {
      const operations = users.flatMap((doc) => [{ index: { _index: this.indexName } }, doc]);

      const response = await this.client.bulk({
        refresh: true,
        operations,
      });

      if (response.errors) {
        const errors = response.items
          .filter((item) => item.index?.error)
          .slice(0, 5)
          .map((item) => item.index?.error);

        this.logger.warn("Some bulk indexing errors occurred:", errors);
      }
    } catch (error) {
      this.logger.error(`Error inserting users: ${error}`);
      throw error;
    }
  }

  /**
   * @method count
   * @description Retrieves the total number of documents in the user index.
   * @returns {Promise<number>} A promise that resolves to the total document count.
   *
   * @signature `count(): Promise<number>`
   * @responsibility To provide a quick count of all users stored in the index.
   */
  async count(): Promise<number> {
    try {
      const result = await this.client.count({ index: this.indexName });
      return result.count;
    } catch (error) {
      this.logger.error(`Error counting documents: ${error}`);
      throw error;
    }
  }

  /**
   * @method findAll
   * @description Fetches all user documents from the index using a memory-efficient scroll search.
   * @summary This method is ideal for processing large datasets. It leverages the Elasticsearch scroll API
   *          (via a client helper) to retrieve documents in batches, avoiding high memory consumption by not
   *          loading the entire result set at once.
   *
   * @param {number} [batchSize=1000] - The number of documents to retrieve in each batch of the scroll.
   * @returns {AsyncGenerator<User[]>} An async generator that yields batches of user documents.
   *
   * @signature `findAll(batchSize?: number): AsyncGenerator<User[]>`
   * @responsibility To provide a scalable method for iterating over all user documents in the index.
   * @usage
   * for await (const userBatch of repository.findAll(500)) {
   *   // Process userBatch
   * }
   */
  async *findAll(batchSize = 1000): AsyncGenerator<User[], void, unknown> {
    try {
      const scrollSearch = this.client.helpers.scrollSearch<User>({
        index: this.indexName,
        scroll: "30s",
        size: batchSize,
        query: { match_all: {} },
      });

      for await (const response of scrollSearch) {
        if (response.documents.length === 0) break;
        yield response.documents;
      }
    } catch (error) {
      this.logger.error(`Error finding all users: ${error}`);
      throw error;
    }
  }

  /**
   * @method getSample
   * @description Fetches a small, limited number of user documents from the index.
   * @summary This method is useful for getting a quick snapshot of the data, for example,
   *          for UI previews, debugging, or health checks.
   * @param {number} count - The maximum number of documents to retrieve.
   * @returns {Promise<User[]>} A promise that resolves to an array of `User` documents.
   *
   * @signature `getSample(count: number): Promise<User[]>`
   * @responsibility To efficiently retrieve a small subset of user data.
   */
  async getSample(count: number): Promise<User[]> {
    try {
      const response = await this.client.search<User>({
        index: this.indexName,
        size: count,
        sort: [{ id: "asc" }],
      });

      return response.hits.hits.map((hit) => hit._source as User);
    } catch (error) {
      this.logger.error(`Error getting sample documents: ${error}`);
      return [];
    }
  }

  /**
   * @method findByIds
   * @description Fetches users from Elasticsearch that match the provided array of IDs.
   * @param {string[]} ids - An array of user IDs to search for.
   * @returns {Promise<User[]>} A promise that resolves to an array of found users.
   */
  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }
    try {
      const result = await this.client.search<User>({
        index: this.indexName,
        size: ids.length,
        query: {
          ids: {
            values: ids,
          },
        },
      });
      return result.hits.hits.map((hit) => hit._source as User);
    } catch (error) {
      this.logger.error(`Error finding documents by IDs: ${error}`);
      return [];
    }
  }
}
