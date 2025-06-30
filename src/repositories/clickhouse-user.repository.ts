/**
 * @fileoverview
 * This file defines the `ClickHouseUserRepository`, a repository class responsible for all interactions
 * with the ClickHouse database concerning user data. It implements a generic `Repository` interface,
 * providing a consistent API for data manipulation. This class abstracts the low-level details of
 * ClickHouse queries for creating tables, inserting data, and fetching records.
 */

import { ClickHouseClient } from "@clickhouse/client-web";
import { User, Repository } from "../types/index";
import { Logger } from "../utils/logger";

/**
 * @class ClickHouseUserRepository
 * @implements {Repository<User>}
 * @description Manages user data persistence in a ClickHouse database.
 * @summary This class provides a comprehensive set of methods to handle all CRUD (Create, Read, Update, Delete)
 *          operations for user entities within a specified ClickHouse table. It encapsulates all the necessary
 *          SQL queries and uses the ClickHouse client to execute them, thus abstracting the data access logic
 *          from the application's business layer.
 *
 * @responsibility
 * - Creating and dropping the user table.
 * - Inserting single or multiple user records.
 * - Clearing all data from the table.
 * - Counting the total number of users.
 * - Retrieving users in batches or as a sample.
 * - Checking for the existence of the table.
 */
export class ClickHouseUserRepository implements Repository<User> {
  /**
   * @constructor
   * @description Initializes a new instance of the `ClickHouseUserRepository`.
   * @param {ClickHouseClient} client - An active instance of the ClickHouse client used for database communication.
   * @param {string} database - The name of the database where the user table resides.
   * @param {string} tableName - The name of the table that this repository will manage.
   * @param {Logger} logger - An instance of the logger for recording operational messages and errors.
   */
  constructor(
    private client: ClickHouseClient,
    private database: string,
    private tableName: string,
    private logger: Logger
  ) {}

  /**
   * @private
   * @property {string} fullTableName
   * @description Constructs the fully qualified table name, including the database prefix.
   *              This is a convenience getter to avoid manual string concatenation and reduce errors.
   * @returns {string} The fully qualified table name (e.g., "default.users").
   */
  private get fullTableName(): string {
    return `${this.database}.${this.tableName}`;
  }

  /**
   * @method exists
   * @description Checks if the user table currently exists in the database.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the table exists, and `false` otherwise.
   *
   * @signature `exists(): Promise<boolean>`
   * @responsibility To safely check for table presence before performing operations like `create` or `clear`.
   * @usage
   * const repository = new ClickHouseUserRepository(...);
   * if (await repository.exists()) {
   *   console.log("Table already exists.");
   * }
   */
  async exists(): Promise<boolean> {
    try {
      const result = await this.client.query({
        query: `EXISTS TABLE ${this.fullTableName}`,
        format: "JSONEachRow",
      });
      const data = await result.json();
      const rows = Array.isArray(data) ? data : [data];
      return rows.length > 0 && (rows[0] as any).result === 1;
    } catch (error) {
      this.logger.error(`Error checking if table exists: ${error}`);
      throw error;
    }
  }

  /**
   * @method create
   * @description Creates the user table in ClickHouse with a predefined schema.
   * @summary This method first checks if the table exists. If it does, it performs a destructive drop-and-recreate
   *          operation. This is suitable for development, testing, or seeding environments where a clean slate is needed.
   *          The table is created with an optimized `MergeTree` engine.
   *
   * @signature `create(): Promise<void>`
   * @responsibility To ensure the user table exists and has the correct schema for the application to function.
   * @warning This is a destructive operation if the table already exists. Use with caution in production.
   */
  async create(): Promise<void> {
    try {
      const tableExists = await this.exists();
      if (tableExists) {
        this.logger.info(`Table "${this.fullTableName}" already exists, dropping...`);
        await this.client.exec({
          query: `DROP TABLE ${this.fullTableName}`,
        });
      }

      const createTableQuery = `
        CREATE TABLE ${this.fullTableName}
        (
          id String,
          firstName String,
          lastName String,
          age UInt8,
          followersCount UInt32,
          timestamp DateTime64(3, 'UTC')
        )
        ENGINE = MergeTree()
        ORDER BY (id)
      `;

      await this.client.exec({ query: createTableQuery });
      this.logger.info(`Table "${this.fullTableName}" created`);
    } catch (error) {
      this.logger.error(`Error creating table: ${error}`);
      throw error;
    }
  }

  /**
   * @method clear
   * @description Removes all data from the user table using the `TRUNCATE` command.
   * @summary This method is a fast and efficient way to delete all records from the table without dropping it.
   *          It first checks if the table exists to avoid errors.
   *
   * @signature `clear(): Promise<void>`
   * @responsibility To provide a mechanism for resetting the user data to a clean state.
   */
  async clear(): Promise<void> {
    try {
      const tableExists = await this.exists();
      if (tableExists) {
        await this.client.exec({
          query: `TRUNCATE TABLE ${this.fullTableName}`,
        });
        this.logger.info(`Table "${this.fullTableName}" cleared`);
      }
    } catch (error) {
      this.logger.error(`Error clearing table: ${error}`);
      throw error;
    }
  }

  /**
   * @method insert
   * @description Inserts a batch of user records into the ClickHouse table.
   * @param {User[]} users - An array of user objects to be inserted. Each object must conform to the `User` interface.
   * @returns {Promise<void>} A promise that resolves when the insertion is complete.
   *
   * @signature `insert(users: User[]): Promise<void>`
   * @responsibility To efficiently bulk-insert user data into the database.
   * @usage
   * const usersToInsert = [{ id: '1', ... }, { id: '2', ... }];
   * await repository.insert(usersToInsert);
   */
  async insert(users: User[]): Promise<void> {
    if (users.length === 0) return;

    try {
      // ClickHouse's JSONEachRow format expects 'YYYY-MM-DD HH:MI:SS.sss' for DateTime64
      const formattedUsers = users.map((user) => ({
        ...user,
        timestamp: user.timestamp.replace("T", " ").replace("Z", ""),
      }));

      await this.client.insert({
        table: this.tableName,
        values: formattedUsers,
        format: "JSONEachRow",
      });
      this.logger.debug(`Inserted ${users.length} users into ClickHouse`);
    } catch (error) {
      this.logger.error(`Error inserting users: ${error}`);
      throw error;
    }
  }

  /**
   * @method count
   * @description Retrieves the total number of records in the user table.
   * @returns {Promise<number>} A promise that resolves to the total count of users.
   *
   * @signature `count(): Promise<number>`
   * @responsibility To provide a quick way to get the size of the dataset.
   */
  async count(): Promise<number> {
    try {
      const result = await this.client.query({
        query: `SELECT count() as count FROM ${this.fullTableName}`,
        format: "JSONEachRow",
      });
      const data = await result.json();
      const rows = Array.isArray(data) ? data : [data];
      return parseInt((rows[0] as any).count, 10) || 0;
    } catch (error) {
      this.logger.error(`Error counting records: ${error}`);
      throw error;
    }
  }

  /**
   * @method findAll
   * @description Fetches all users from the ClickHouse table using a streaming approach to handle large datasets.
   * @summary This method returns an `AsyncGenerator` that yields batches of users. This is highly memory-efficient
   *          as it doesn't load the entire table into memory at once. It's the recommended way to process all
   *          records from a large table.
   *
   * @param {number} [batchSize=1000] - The number of users to include in each yielded batch.
   * @returns {AsyncGenerator<User[]>} An async generator that yields arrays of `User` objects.
   *
   * @signature `findAll(batchSize?: number): AsyncGenerator<User[]>`
   * @responsibility To provide a scalable way to iterate over the entire user dataset.
   * @usage
   * for await (const userBatch of repository.findAll(500)) {
   *   // Process userBatch
   * }
   */
  async *findAll(batchSize = 1000): AsyncGenerator<User[], void, unknown> {
    try {
      const stream = (
        await this.client.query({
          query: `SELECT * FROM ${this.fullTableName} ORDER BY id`,
          format: "JSONEachRow",
        })
      ).stream();

      let buffer: User[] = [];
      for await (const rows of stream) {
        const users = rows.map((row: { json: <T>() => T }) => row.json<User>());
        buffer.push(...users);
        while (buffer.length >= batchSize) {
          yield buffer.slice(0, batchSize);
          buffer = buffer.slice(batchSize);
        }
      }
      if (buffer.length > 0) {
        yield buffer;
      }
    } catch (error) {
      this.logger.error(`Error finding all users: ${error}`);
      throw error;
    }
  }

  /**
   * @method getSample
   * @description Fetches a small, limited number of user records from the table.
   * @summary Useful for quick checks, debugging, or displaying a preview of the data without querying the entire table.
   * @param {number} count - The maximum number of users to retrieve.
   * @returns {Promise<User[]>} A promise that resolves to an array of `User` objects.
   *
   * @signature `getSample(count: number): Promise<User[]>`
   * @responsibility To provide a simple way to get a snapshot of the data.
   */
  async getSample(count: number): Promise<User[]> {
    try {
      const result = await this.client.query({
        query: `SELECT * FROM ${this.fullTableName} ORDER BY id LIMIT ${count}`,
        format: "JSONEachRow",
      });
      const data = await result.json<User[]>();
      // The client with JSONEachRow might return an array or a single object
      // depending on the result set size. We ensure it's always an array.
      const rows = Array.isArray(data) ? data : [data];
      return rows.flat();
    } catch (error) {
      this.logger.error(`Error getting sample users from ClickHouse: ${error}`);
      return [];
    }
  }

  /**
   * @method findByIds
   * @description Fetches users from ClickHouse that match the provided array of IDs.
   * @param {string[]} ids - An array of user IDs to search for.
   * @returns {Promise<User[]>} A promise that resolves to an array of found users.
   */
  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }
    try {
      const resultSet = await this.client.query({
        query: `SELECT * FROM ${this.fullTableName} WHERE id IN ({ids:Array(String)})`,
        query_params: {
          ids,
        },
        format: "JSONEachRow",
      });
      const data = (await resultSet.json()) as User[];
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      this.logger.error(`Error finding records by IDs: ${error}`);
      return [];
    }
  }
}
