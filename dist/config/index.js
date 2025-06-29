"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = exports.clickhouseConfig = exports.elasticsearchConfig = void 0;
exports.initializeConfig = initializeConfig;
exports.getConfig = getConfig;
const env_validator_1 = require("../utils/env-validator");
const logger_1 = require("../utils/logger");
const database_1 = require("./database");
Object.defineProperty(exports, "elasticsearchConfig", { enumerable: true, get: function () { return database_1.elasticsearchConfig; } });
Object.defineProperty(exports, "clickhouseConfig", { enumerable: true, get: function () { return database_1.clickhouseConfig; } });
const app_1 = require("./app");
Object.defineProperty(exports, "appConfig", { enumerable: true, get: function () { return app_1.appConfig; } });
/**
 * Initializes and validates all application configuration
 * @param exitOnError - Whether to exit process on validation errors (default: true)
 * @returns Configuration object
 */
function initializeConfig(exitOnError = true) {
    logger_1.logger.info("🔧 Initializing application configuration...");
    // Reset validation state to ensure clean validation
    env_validator_1.envValidator.reset();
    // Initialize all configurations (this triggers validation)
    const config = {
        elasticsearch: database_1.elasticsearchConfig,
        clickhouse: database_1.clickhouseConfig,
        app: app_1.appConfig,
    };
    // Log validation summary
    env_validator_1.envValidator.logValidationSummary();
    // Handle validation errors
    if (env_validator_1.envValidator.hasErrors()) {
        const errors = env_validator_1.envValidator.getErrors();
        logger_1.logger.error(`❌ Configuration validation failed with ${errors.length} error(s)`);
        if (exitOnError) {
            logger_1.logger.error("💥 Exiting due to configuration errors");
            process.exit(1);
        }
        else {
            logger_1.logger.warn("⚠️ Continuing with invalid configuration (not recommended for production)");
        }
    }
    else {
        logger_1.logger.info("✅ Configuration validation successful");
    }
    return config;
}
/**
 * Get validated configuration instance
 * @param exitOnError - Whether to exit process on validation errors
 */
function getConfig(exitOnError = true) {
    return initializeConfig(exitOnError);
}
