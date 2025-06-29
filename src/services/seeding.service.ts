import { ElasticsearchUserRepository } from "../repositories/elasticsearch-user.repository";
import { UserDataGenerator } from "../utils/data-generator";
import { Logger } from "../utils/logger";
import { ProgressCallback } from "../types/index";

export interface SeedingOptions {
  cleanup?: boolean;
  batchSize?: number;
  onProgress?: ProgressCallback;
}

export class SeedingService {
  constructor(
    private repository: ElasticsearchUserRepository,
    private dataGenerator: UserDataGenerator,
    private logger: Logger
  ) {}

  async seed(userCount: number, options: SeedingOptions = {}): Promise<void> {
    const { cleanup = true, batchSize = 1000, onProgress } = options;

    this.logger.info(`Starting to seed ${userCount} users...`);

    try {
      if (cleanup) {
        await this.repository.create();
      }

      let processedCount = 0;
      for await (const users of this.dataGenerator.generateUsersInBatches(userCount, batchSize)) {
        await this.repository.insert(users);

        processedCount += users.length;
        this.logger.info(`Seeded ${processedCount}/${userCount} users`);

        if (onProgress) {
          onProgress(processedCount, userCount);
        }
      }

      const finalCount = await this.repository.count();
      this.logger.info(`Seeding completed. Total documents: ${finalCount}`);
    } catch (error) {
      this.logger.error(`Seeding failed: ${error}`);
      throw error;
    }
  }

  async getStatus(): Promise<{ exists: boolean; count: number }> {
    const exists = await this.repository.exists();
    const count = exists ? await this.repository.count() : 0;
    return { exists, count };
  }
}
