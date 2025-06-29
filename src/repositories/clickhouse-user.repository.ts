import { ClickHouseClient } from "@clickhouse/client-web";
import { User, Repository } from "../types/index";
import { Logger } from "../utils/logger";

export class ClickHouseUserRepository implements Repository<User> {
  constructor(
    private client: ClickHouseClient,
    private database: string,
    private tableName: string,
    private logger: Logger
  ) {}

  private get fullTableName(): string {
    return `${this.database}.${this.tableName}`;
  }

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
          followersCount UInt32
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

  async insert(users: User[]): Promise<void> {
    if (users.length === 0) return;

    try {
      await this.client.insert<User>({
        table: this.tableName,
        values: users,
        format: "JSONEachRow",
      });
      this.logger.debug(`Inserted ${users.length} users into ClickHouse`);
    } catch (error) {
      this.logger.error(`Error inserting users: ${error}`);
      throw error;
    }
  }

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
}
