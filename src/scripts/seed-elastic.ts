#!/usr/bin/env ts-node
/**
 * @fileoverview
 * This script is responsible for seeding the Elasticsearch index with mock user data.
 * It initializes the configuration, sets up the necessary Elasticsearch client and repository,
 * and then uses the `SeedingService` along with a `UserDataGenerator` to populate the
 * database. It's intended for setting up a development or testing environment with
 * realistic data.
 *
 * @usage
 * ```
 * npx ts-node src/scripts/seed-elastic.ts
 * ```
 */

import { DatabaseClientFactory } from "../factories/database-clients";
import { ElasticsearchUserRepository } from "../repositories/elasticsearch-user.repository";
import { SeedingService } from "../services/seeding.service";
import { UserDataGenerator } from "../utils/data-generator";
import { logger } from "../utils/logger";
import { initializeConfig } from "../config";

/**
 * @function main
 * @description The main entry point for the Elasticsearch seeding script.
 * @summary This function performs the following actions:
 * 1. Initializes and validates the application configuration.
 * 2. Creates an Elasticsearch client instance.
 * 3. Instantiates the `ElasticsearchUserRepository`.
 * 4. Sets up the `UserDataGenerator` and the `SeedingService`.
 * 5. Executes the seeding process based on the configured number of mock users and batch size.
 * 6. Logs progress and reports the final outcome.
 * 7. Ensures the Elasticsearch client connection is closed upon completion or error.
 *
 * @returns {Promise<void>} A promise that resolves when the script finishes.
 *
 * @responsibility
 * - To serve as the executable for populating the Elasticsearch database with test data.
 * - To orchestrate the setup of all required components for seeding.
 * - To handle the seeding workflow and provide user feedback.
 */
async function main(): Promise<void> {
  // Initialize and validate configuration
  const config = initializeConfig();

  const client = DatabaseClientFactory.createElasticsearchClient(config.elasticsearch);

  try {
    const repository = new ElasticsearchUserRepository(client, config.elasticsearch.index, logger);

    const dataGenerator = new UserDataGenerator();
    const seedingService = new SeedingService(repository, dataGenerator, logger);

    await seedingService.seed(config.app.mockUsersCount, {
      batchSize: config.app.batchSize,
      onProgress: (processed, total) => {
        const percentage = total ? Math.round((processed / total) * 100) : 0;
        logger.info(`Progress: ${percentage}% (${processed}/${total})`);
      },
    });

    logger.info("🎉 Seeding completed successfully!");
  } catch (error) {
    logger.error(`❌ Seeding failed: ${error}`);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Block to ensure the main function is called only when the script is executed directly
if (require.main === module) {
  main();
}

/**
 * @exports seedElastic
 * @description Exports the main seeding function, allowing it to be imported and executed programmatically from other modules.
 * @type {function}
 */
export { main as seedElastic };
