#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedElastic = main;
const database_clients_1 = require("../factories/database-clients");
const elasticsearch_user_repository_1 = require("../repositories/elasticsearch-user.repository");
const seeding_service_1 = require("../services/seeding.service");
const data_generator_1 = require("../utils/data-generator");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
async function main() {
    // Initialize and validate configuration
    const config = (0, config_1.initializeConfig)();
    const client = database_clients_1.DatabaseClientFactory.createElasticsearchClient(config.elasticsearch);
    try {
        const repository = new elasticsearch_user_repository_1.ElasticsearchUserRepository(client, config.elasticsearch.index, logger_1.logger);
        const dataGenerator = new data_generator_1.UserDataGenerator();
        const seedingService = new seeding_service_1.SeedingService(repository, dataGenerator, logger_1.logger);
        await seedingService.seed(config.app.mockUsersCount, {
            batchSize: config.app.batchSize,
            onProgress: (processed, total) => {
                const percentage = total ? Math.round((processed / total) * 100) : 0;
                logger_1.logger.info(`Progress: ${percentage}% (${processed}/${total})`);
            },
        });
        logger_1.logger.info("🎉 Seeding completed successfully!");
    }
    catch (error) {
        logger_1.logger.error(`❌ Seeding failed: ${error}`);
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
// Run if this file is executed directly
if (require.main === module) {
    main();
}
