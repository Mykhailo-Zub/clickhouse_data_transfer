#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = main;
const database_clients_1 = require("../factories/database-clients");
const elasticsearch_user_repository_1 = require("../repositories/elasticsearch-user.repository");
const clickhouse_user_repository_1 = require("../repositories/clickhouse-user.repository");
const migration_service_1 = require("../services/migration.service");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
async function main() {
    // Initialize and validate configuration
    const config = (0, config_1.initializeConfig)();
    const clients = database_clients_1.DatabaseClientFactory.createClients(config.elasticsearch, config.clickhouse);
    try {
        const sourceRepository = new elasticsearch_user_repository_1.ElasticsearchUserRepository(clients.elasticsearch, config.elasticsearch.index, logger_1.logger);
        const targetRepository = new clickhouse_user_repository_1.ClickHouseUserRepository(clients.clickhouse, config.clickhouse.database, config.clickhouse.table, logger_1.logger);
        const migrationService = new migration_service_1.MigrationService(sourceRepository, targetRepository, logger_1.logger);
        const result = await migrationService.migrate({
            batchSize: config.app.batchSize,
            onProgress: (processed, total) => {
                const percentage = total ? Math.round((processed / total) * 100) : 0;
                logger_1.logger.info(`Migration progress: ${percentage}% (${processed}/${total})`);
            },
        });
        if (result.success) {
            logger_1.logger.info("🎉 Migration completed successfully!");
        }
        else {
            logger_1.logger.error("❌ Migration completed with errors - count mismatch detected");
            process.exit(1);
        }
    }
    catch (error) {
        logger_1.logger.error(`❌ Migration failed: ${error}`);
        process.exit(1);
    }
    finally {
        await clients.elasticsearch.close();
        await clients.clickhouse.close();
    }
}
// Run if this file is executed directly
if (require.main === module) {
    main();
}
