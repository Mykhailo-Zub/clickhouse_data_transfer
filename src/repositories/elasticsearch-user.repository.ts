import { Client as ElasticClient } from "@elastic/elasticsearch";
import { User, Repository, UserMapping } from "../types/index";
import { Logger } from "../utils/logger";

export class ElasticsearchUserRepository implements Repository<User> {
  private readonly mapping: UserMapping = {
    properties: {
      id: { type: "keyword" },
      firstName: { type: "text" },
      lastName: { type: "text" },
      age: { type: "integer" },
      followersCount: { type: "integer" },
    },
  };

  constructor(private client: ElasticClient, private indexName: string, private logger: Logger) {}

  async exists(): Promise<boolean> {
    try {
      return await this.client.indices.exists({ index: this.indexName });
    } catch (error) {
      this.logger.error(`Error checking if index exists: ${error}`);
      throw error;
    }
  }

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

  async count(): Promise<number> {
    try {
      const result = await this.client.count({ index: this.indexName });
      return result.count;
    } catch (error) {
      this.logger.error(`Error counting documents: ${error}`);
      throw error;
    }
  }

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
}
