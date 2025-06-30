#!/usr/bin/env ts-node
/**
 * @fileoverview
 * This script orchestrates the data migration process from Elasticsearch to ClickHouse.
 * It initializes the necessary configurations, creates database clients and repositories,
 * and then runs the `MigrationService` to transfer the data. The script is designed
 * to be executed directly from the command line using `ts-node`.
 *
 * @usage
 * ```
 * npx ts-node src/scripts/migrate-to-clickhouse.ts
 * ```
 */

import { DatabaseClientFactory } from "../factories/database-clients";
import { ElasticsearchUserRepository } from "../repositories/elasticsearch-user.repository";
import { ClickHouseUserRepository } from "../repositories/clickhouse-user.repository";
import { MigrationService } from "../services/migration.service";
import { logger } from "../utils/logger";
import { initializeConfig } from "../config";

/**
 * @function main
 * @description The main entry point for the migration script.
 * @summary This function performs the following steps:
 * 1. Initializes and validates the application configuration.
 * 2. Creates instances of the Elasticsearch and ClickHouse clients.
 * 3. Instantiates the source (Elasticsearch) and target (ClickHouse) repositories.
 * 4. Initializes the `MigrationService` with the repositories.
 * 5. Executes the migration process, providing a progress callback to log status.
 * 6. Reports the final outcome (success or failure) and exits the process accordingly.
 * 7. Ensures database connections are closed gracefully in all scenarios.
 *
 * @returns {Promise<void>} A promise that resolves when the script completes or exits.
 *
 * @responsibility
 * - To serve as the executable entry point for the data migration task.
 * - To properly set up all dependencies required for the migration.
 * - To handle the overall workflow and report on its progress and result.
 */
async function main(): Promise<void> {
  // Initialize and validate configuration
  const config = initializeConfig();

  const clients = DatabaseClientFactory.createClients(config.elasticsearch, config.clickhouse);

  try {
    const sourceRepository = new ElasticsearchUserRepository(
      clients.elasticsearch,
      config.elasticsearch.index,
      logger
    );

    const targetRepository = new ClickHouseUserRepository(
      clients.clickhouse,
      config.clickhouse.database,
      config.clickhouse.table,
      logger
    );

    const migrationService = new MigrationService(sourceRepository, targetRepository, logger);

    const result = await migrationService.migrate({
      batchSize: config.app.batchSize,
      onProgress: (processed, total) => {
        const percentage = total ? Math.round((processed / total) * 100) : 0;
        logger.info(`Migration progress: ${percentage}% (${processed}/${total})`);
      },
    });

    if (result.success) {
      logger.info("🎉 Migration completed successfully!");
    } else {
      logger.error("❌ Migration completed with errors - count mismatch detected");
      process.exit(1);
    }
  } catch (error) {
    logger.error(`❌ Migration failed: ${error}`);
    process.exit(1);
  } finally {
    await clients.elasticsearch.close();
    await clients.clickhouse.close();
  }
}

// Block to ensure the main function is called only when the script is executed directly
if (require.main === module) {
  main();
}

/**
 * @exports migrate
 * @description Exports the main migration function so it can be potentially imported and used in other modules.
 * @type {function}
 */
export { main as migrate };
