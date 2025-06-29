#!/usr/bin/env ts-node

import { DatabaseClientFactory } from "../factories/database-clients";
import { ElasticsearchUserRepository } from "../repositories/elasticsearch-user.repository";
import { SeedingService } from "../services/seeding.service";
import { UserDataGenerator } from "../utils/data-generator";
import { logger } from "../utils/logger";
import { initializeConfig } from "../config";

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

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { main as seedElastic };
