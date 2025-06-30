/**
 * @fileoverview
 * This file defines the `SeedingService`, a component dedicated to populating a database
 * with mock data. It works with a repository and a data generator to create and insert
 * records in batches, making it suitable for setting up development or test environments.
 */

import { ElasticsearchUserRepository } from "../repositories/elasticsearch-user.repository";
import { UserDataGenerator } from "../utils/data-generator";
import { Logger } from "../utils/logger";
import { ProgressCallback } from "../types/index";

/**
 * @interface SeedingOptions
 * @description Defines the configuration options for the seeding process.
 *
 * @property {boolean} [cleanup=true] - If true, the service will clean up the target repository (e.g., recreate the index/table)
 *                                      before seeding.
 * @property {number} [batchSize=1000] - The number of records to generate and insert in each batch.
 * @property {ProgressCallback} [onProgress] - An optional callback function to report progress during the seeding operation.
 */
export interface SeedingOptions {
  cleanup?: boolean;
  batchSize?: number;
  onProgress?: ProgressCallback;
}

/**
 * @class SeedingService
 * @description Orchestrates the process of populating a repository with generated data.
 * @summary This service coordinates a data generator and a repository to perform a seeding operation.
 *          It handles the setup (cleanup), batch processing, progress reporting, and final verification,
 *          abstracting the complexities of the seeding workflow.
 *
 * @responsibility
 * - Managing the overall seeding process.
 * - Cleaning the target repository before seeding (optional).
 * - Generating and inserting data in manageable batches.
 * - Providing progress updates via a callback.
 * - Verifying and logging the final state of the repository.
 */
export class SeedingService {
  /**
   * @constructor
   * @description Initializes a new instance of the `SeedingService`.
   * @param {ElasticsearchUserRepository} repository - The repository to be seeded with data.
   * @param {UserDataGenerator} dataGenerator - The generator responsible for creating mock user data.
   * @param {Logger} logger - An instance of the logger for informational and error messages.
   */
  constructor(
    private repository: ElasticsearchUserRepository,
    private dataGenerator: UserDataGenerator,
    private logger: Logger
  ) {}

  /**
   * @method seed
   * @description Executes the database seeding process.
   * @summary This method generates a specified number of user records and inserts them into the repository in batches.
   *          It can optionally clean the repository before starting. Progress is logged and can be reported
   *          via a callback.
   *
   * @param {number} userCount - The total number of users to generate and seed.
   * @param {SeedingOptions} [options={}] - Configuration options for the seeding process.
   * @returns {Promise<void>} A promise that resolves when the seeding is complete.
   *
   * @signature `seed(userCount: number, options?: SeedingOptions): Promise<void>`
   * @usage
   * await seedingService.seed(10000, {
   *   batchSize: 500,
   *   onProgress: (p, t) => console.log(`${p}/${t}`)
   * });
   */
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

  /**
   * @method getStatus
   * @description Retrieves the current status of the repository being managed by the service.
   * @summary It checks if the underlying data store (e.g., index) exists and, if so, returns the number of records it contains.
   * @returns {Promise<{exists: boolean, count: number}>} A promise that resolves to an object with the existence status and record count.
   *
   * @signature `getStatus(): Promise<{exists: boolean, count: number}>`
   */
  async getStatus(): Promise<{ exists: boolean; count: number }> {
    const exists = await this.repository.exists();
    const count = exists ? await this.repository.count() : 0;
    return { exists, count };
  }
}
