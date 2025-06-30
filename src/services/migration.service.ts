/**
 * @fileoverview
 * This file contains the `MigrationService`, which is the core component for handling
 * the data migration logic. It orchestrates the process of transferring data from a
 * source repository (Elasticsearch) to a target repository (ClickHouse),
 * ensuring data integrity and providing progress feedback.
 */

import { ElasticsearchUserRepository } from "../repositories/elasticsearch-user.repository";
import { ClickHouseUserRepository } from "../repositories/clickhouse-user.repository";
import { Logger } from "../utils/logger";
import { MigrationOptions, MigrationResult, User } from "../types/index";
import { formatDuration } from "../utils/formatter";

/**
 * @class MigrationService
 * @description Orchestrates the data migration process between two repositories.
 * @summary This service is responsible for the end-to-end data migration workflow. It coordinates
 *          the source and target repositories to prepare the target environment, transfer data in
 *          efficient batches, verify the integrity of the migrated data by comparing record counts,
 *          and perform a sample data check for visual validation.
 *
 * @responsibility
 * - Preparing the target repository for migration (e.g., creating tables).
 * - Reading data from the source in batches.
 * - Writing data to the target in batches.
 * - Reporting progress during the migration.
 * - Verifying the final record counts between source and target.
 * - Performing a visual sample data verification.
 */
export class MigrationService {
  /**
   * @constructor
   * @description Initializes a new instance of the `MigrationService`.
   * @param {ElasticsearchUserRepository} sourceRepository - The repository instance for the data source (e.g., Elasticsearch).
   * @param {ClickHouseUserRepository} targetRepository - The repository instance for the data target (e.g., ClickHouse).
   * @param {Logger} logger - The logger instance for outputting progress and error messages.
   */
  constructor(
    private sourceRepository: ElasticsearchUserRepository,
    private targetRepository: ClickHouseUserRepository,
    private logger: Logger
  ) {}

  /**
   * @method migrate
   * @description Executes the full data migration process from the source to the target repository.
   * @summary The method follows these steps:
   *          1. Prepares the target repository by creating/clearing the destination table.
   *          2. Fetches the total record count from the source for progress tracking.
   *          3. Reads data from the source and writes to the target in batches.
   *          4. Invokes the `onProgress` callback after each batch.
   *          5. After all data is transferred, it verifies that the record counts match.
   *          6. If verification is successful, it runs a sample data check.
   *          7. Returns a detailed result object.
   *
   * @param {MigrationOptions} [options={}] - Configuration options for the migration, such as `batchSize` and the `onProgress` callback.
   *   @param {number} [options.batchSize=1000] - The number of records to process in each batch.
   *   @param {(processed: number, total: number) => void} [options.onProgress] - A callback function to report progress.
   * @returns {Promise<MigrationResult>} A promise that resolves to an object containing the migration results,
   *                                     including source/target counts, success status, and total duration.
   *
   * @signature `migrate(options?: MigrationOptions): Promise<MigrationResult>`
   */
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
        await this.verifySampleData();
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

  /**
   * @method getStatus
   * @description Retrieves the current status of both the source and target data stores.
   * @summary This method checks for the existence of the source index and target table and returns their respective record counts.
   *          It's useful for assessing the state of the databases before or after a migration.
   *
   * @returns {Promise<{sourceExists: boolean, sourceCount: number, targetExists: boolean, targetCount: number}>}
   *          A promise that resolves to an object containing the existence status and record counts for both repositories.
   *
   * @signature `getStatus(): Promise<{...}>`
   */
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

  /**
   * @private
   * @method verifySampleData
   * @description Performs a basic visual verification by fetching a small sample of data from both the source
   *              and target repositories and printing them in a comparable format.
   * @summary This method helps to quickly spot-check if the data appears correct after migration. It is not a
   *          substitute for a full data integrity check but serves as a useful first-pass validation.
   *
   * @param {number} [sampleSize=5] - The number of records to fetch for the sample comparison.
   * @returns {Promise<void>} A promise that resolves when the verification is complete.
   *
   * @responsibility To provide a quick, visual confirmation that the migrated data is structurally similar
   *                 to the source data.
   */
  private async verifySampleData(sampleSize = 5): Promise<void> {
    this.logger.info(`Fetching ${sampleSize} sample documents for visual verification...`);

    try {
      let sourceSample = await this.sourceRepository.getSample(sampleSize);

      if (sourceSample.length === 0) {
        this.logger.warn(
          "Could not retrieve a sample from the source. Skipping visual verification."
        );
        return;
      }

      const sampleIds = sourceSample.map((user) => user.id);
      let targetSample = await this.targetRepository.findByIds(sampleIds);

      // Sort samples by ID to ensure consistent order for comparison
      sourceSample = sourceSample.sort((a, b) => a.id.localeCompare(b.id));
      targetSample = targetSample.sort((a, b) => a.id.localeCompare(b.id));

      this.logger.info("--- Data Sample Comparison ---");
      this.logger.info("Source (Elasticsearch) vs. Target (ClickHouse)");

      // Simple table-like output
      const header = `| ID                                   | First Name       | Last Name       | Age | Followers |`;
      const separator = `+--------------------------------------+------------------+-----------------+-----+-----------+`;

      this.logger.info(separator);
      this.logger.info(header);
      this.logger.info(separator);

      for (let i = 0; i < sourceSample.length; i++) {
        const sourceUser = sourceSample[i];
        const targetUser = targetSample.find((u) => u.id === sourceUser.id);

        if (!targetUser) {
          this.logger.warn(`Mismatch: User with ID ${sourceUser.id} not found in target`);
          continue;
        }

        const formatRow = (user: Partial<User>, source: string) =>
          `| ${user.id?.padEnd(36) ?? "N/A".padEnd(36)} | ${(user.firstName ?? "N/A").padEnd(
            16
          )} | ${(user.lastName ?? "N/A").padEnd(15)} | ${String(user.age ?? "N/A").padEnd(
            3
          )} | ${String(user.followersCount ?? "N/A").padEnd(9)} |`;

        this.logger.info(formatRow(sourceUser, "Source"));
        this.logger.info(formatRow(targetUser, "Target"));
        this.logger.info(separator);

        // Deep comparison after normalizing timestamp from ClickHouse
        const sourceJson = JSON.stringify(sourceUser);
        const normalizedTarget = {
          ...targetUser,
          timestamp: new Date(targetUser.timestamp.replace(" ", "T") + "Z").toISOString(),
        };
        const targetJson = JSON.stringify(normalizedTarget);

        if (sourceJson !== targetJson) {
          this.logger.warn(`Mismatch found for row ${i + 1}`);
          this.logger.debug(`Source: ${sourceJson}`);
          this.logger.debug(`Target: ${targetJson}`);
        }
      }

      this.logger.info("--- End of Comparison ---");
    } catch (error) {
      this.logger.error(`Error during sample data verification: ${error}`);
    }
  }
}
