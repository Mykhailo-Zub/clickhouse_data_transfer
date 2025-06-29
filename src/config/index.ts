import { envValidator } from "../utils/env-validator";
import { logger } from "../utils/logger";
import { elasticsearchConfig, clickhouseConfig } from "./database";
import { appConfig } from "./app";

export interface Config {
  elasticsearch: typeof elasticsearchConfig;
  clickhouse: typeof clickhouseConfig;
  app: typeof appConfig;
}

/**
 * Initializes and validates all application configuration
 * @param exitOnError - Whether to exit process on validation errors (default: true)
 * @returns Configuration object
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
 * Get validated configuration instance
 * @param exitOnError - Whether to exit process on validation errors
 */
export function getConfig(exitOnError: boolean = true): Config {
  return initializeConfig(exitOnError);
}

// Export individual configs for backward compatibility
export { elasticsearchConfig, clickhouseConfig, appConfig };
