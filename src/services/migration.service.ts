import { ElasticsearchUserRepository } from "../repositories/elasticsearch-user.repository";
import { ClickHouseUserRepository } from "../repositories/clickhouse-user.repository";
import { Logger } from "../utils/logger";
import { MigrationOptions, MigrationResult } from "../types/index";
import { formatDuration } from "../utils/formatter";

export class MigrationService {
  constructor(
    private sourceRepository: ElasticsearchUserRepository,
    private targetRepository: ClickHouseUserRepository,
    private logger: Logger
  ) {}

  async migrate(options: MigrationOptions = {}): Promise<MigrationResult> {
    const { batchSize = 1000, onProgress } = options;
    const startTime = Date.now();

    this.logger.info("🚀 Starting migration from Elasticsearch to ClickHouse...");

    try {
      // Prepare target repository
      await this.targetRepository.create();
      await this.targetRepository.clear();

      // Get source count for verification
      const sourceCount = await this.sourceRepository.count();
      this.logger.info(`Found ${sourceCount} documents to migrate`);

      let processedCount = 0;

      // Migrate data in batches
      for await (const users of this.sourceRepository.findAll(batchSize)) {
        await this.targetRepository.insert(users);

        processedCount += users.length;
        this.logger.info(`Migrated ${processedCount}/${sourceCount} documents`);

        if (onProgress) {
          onProgress(processedCount, sourceCount);
        }
      }

      // Verification
      const targetCount = await this.targetRepository.count();
      const success = sourceCount === targetCount;
      const durationMs = Date.now() - startTime;

      this.logger.info("----------------------------------------");
      this.logger.info("✅ Migration completed!");
      this.logger.info(`Source count: ${sourceCount}`);
      this.logger.info(`Target count: ${targetCount}`);
      this.logger.info(`Duration: ${formatDuration(durationMs)}`);

      if (success) {
        this.logger.info("✅ Verification successful: Counts match");
      } else {
        this.logger.error("❌ Verification failed: Counts do not match");
      }

      this.logger.info("----------------------------------------");

      return {
        sourceCount,
        targetCount,
        success,
        durationMs,
      };
    } catch (error) {
      this.logger.error(`Migration failed: ${error}`);
      throw error;
    }
  }

  async getStatus(): Promise<{
    sourceExists: boolean;
    sourceCount: number;
    targetExists: boolean;
    targetCount: number;
  }> {
    const [sourceExists, targetExists] = await Promise.all([
      this.sourceRepository.exists(),
      this.targetRepository.exists(),
    ]);

    const [sourceCount, targetCount] = await Promise.all([
      sourceExists ? this.sourceRepository.count() : 0,
      targetExists ? this.targetRepository.count() : 0,
    ]);

    return {
      sourceExists,
      sourceCount,
      targetExists,
      targetCount,
    };
  }
}
