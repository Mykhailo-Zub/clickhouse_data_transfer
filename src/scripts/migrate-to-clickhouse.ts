#!/usr/bin/env ts-node

import { DatabaseClientFactory } from "../factories/database-clients";
import { ElasticsearchUserRepository } from "../repositories/elasticsearch-user.repository";
import { ClickHouseUserRepository } from "../repositories/clickhouse-user.repository";
import { MigrationService } from "../services/migration.service";
import { logger } from "../utils/logger";
import { initializeConfig } from "../config";

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

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { main as migrate };
