/**
 * @fileoverview
 * This file centralizes the application's configuration management. It aggregates configurations
 * from different modules (e.g., database, app settings), provides a function to initialize
 * and validate them, and exports them for use throughout the application. This ensures a single,
 * reliable source of configuration and helps prevent issues from invalid or missing settings.
 */

import { envValidator } from "../utils/env-validator";
import { logger } from "../utils/logger";
import { elasticsearchConfig, clickhouseConfig } from "./database";
import { appConfig } from "./app";

/**
 * @interface Config
 * @description Defines the overall structure of the application's configuration object. It aggregates
 *              all specific configuration objects (Elasticsearch, ClickHouse, App) into a single,
 *              cohesive structure. This provides a centralized and type-safe way to access all
 *              configuration settings across the application.
 *
 * @property {typeof elasticsearchConfig} elasticsearch - Holds the configuration for the Elasticsearch client.
 * @property {typeof clickhouseConfig} clickhouse - Holds the configuration for the ClickHouse client.
 * @property {typeof appConfig} app - Holds the general application settings.
 */
export interface Config {
  elasticsearch: typeof elasticsearchConfig;
  clickhouse: typeof clickhouseConfig;
  app: typeof appConfig;
}

/**
 * @function initializeConfig
 * @description Initializes, validates, and aggregates all application configurations.
 *              This function orchestrates the configuration loading process. It resets the environment validator,
 *              constructs the main config object, logs the validation results, and handles any validation errors.
 *              It's the core of the application's startup configuration sequence.
 *
 * @param {boolean} [exitOnError=true] - If `true`, the process will exit with a status code of 1 if any
 *                                       configuration validation errors are found. If `false`, it will log a warning
 *                                       and continue, which is useful for testing or environments where startup
 *                                       must not be blocked.
 * @returns {Config} - The fully validated and structured application configuration object.
 *
 * @responsibility
 * - Ensures that all environment variables are validated before the application starts.
 * - Provides a clear summary of the configuration status (success or failure with details).
 * - Centralizes the logic for handling configuration errors, making the application's startup behavior predictable.
 *
 * @usage
 * This function should be called once at the very beginning of the application's lifecycle to ensure
 * all subsequent operations have access to a valid configuration.
 *
 * @example
 * // In the main application entry point:
 * const config = initializeConfig();
 * // Now use config.elasticsearch, config.clickhouse, etc.
 */
export function initializeConfig(exitOnError: boolean = true): Config {
  logger.info("🔧 Initializing application configuration...");

  // Reset validation state to ensure clean validation
  envValidator.reset();

  // Initialize all configurations (this triggers validation)
  const config: Config = {
    elasticsearch: elasticsearchConfig,
    clickhouse: clickhouseConfig,
    app: appConfig,
  };

  // Log validation summary
  envValidator.logValidationSummary();

  // Handle validation errors
  if (envValidator.hasErrors()) {
    const errors = envValidator.getErrors();
    logger.error(`❌ Configuration validation failed with ${errors.length} error(s)`);

    if (exitOnError) {
      logger.error("💥 Exiting due to configuration errors");
      process.exit(1);
    } else {
      logger.warn("⚠️ Continuing with invalid configuration (not recommended for production)");
    }
  } else {
    logger.info("✅ Configuration validation successful");
  }

  return config;
}

/**
 * @function getConfig
 * @description A convenience wrapper around `initializeConfig` to get the validated configuration instance.
 *              This function is the primary way other parts of the application should access the configuration.
 *              It ensures that the configuration is always initialized and validated before being used.
 *
 * @param {boolean} [exitOnError=true] - Passed directly to `initializeConfig`. Determines if the application
 *                                       should exit on validation errors.
 * @returns {Config} - The validated application configuration object.
 *
 * @see {@link initializeConfig}
 *
 * @usage
 * Import and call this function wherever configuration is needed.
 * @example
 * import { getConfig } from './config';
 * const config = getConfig();
 * const esNode = config.elasticsearch.node;
 */
export function getConfig(exitOnError: boolean = true): Config {
  return initializeConfig(exitOnError);
}

/**
 * @deprecated Use `getConfig()` to get the entire configuration object instead.
 *             These individual exports are maintained for backward compatibility but may be removed in a future version.
 *             Accessing config through `getConfig` ensures that validation has been performed.
 */
export { elasticsearchConfig, clickhouseConfig, appConfig };
