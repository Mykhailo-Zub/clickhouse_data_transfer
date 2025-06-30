/**
 * @fileoverview
 * This file provides a simple, configurable logging utility for the application.
 * It defines a standard `Logger` interface, a `ConsoleLogger` implementation, and exports
 * a default logger instance. The log level can be configured via an environment variable,
 * allowing for flexible log output in different environments.
 */

/**
 * @enum {number} LogLevel
 * @description Defines the available logging levels, ordered by severity.
 */
export enum LogLevel {
  /** For detailed debugging information. */
  DEBUG = 0,
  /** For general informational messages. */
  INFO = 1,
  /** For warnings about potential issues. */
  WARN = 2,
  /** For critical errors that may affect application stability. */
  ERROR = 3,
}

/**
 * @interface Logger
 * @description Defines a standard contract for a logger.
 * @summary Any logger implementation must provide these methods, ensuring that different
 *          logging strategies can be used interchangeably throughout the application.
 */
export interface Logger {
  /** Logs a debug message. */
  debug(message: string, ...args: any[]): void;
  /** Logs an informational message. */
  info(message: string, ...args: any[]): void;
  /** Logs a warning message. */
  warn(message: string, ...args: any[]): void;
  /** Logs an error message. */
  error(message: string, ...args: any[]): void;
}

/**
 * @class ConsoleLogger
 * @implements {Logger}
 * @description A simple logger implementation that writes messages to the console.
 * @summary It supports different log levels and will only output messages that meet the
 *          configured severity threshold. The log level is determined by the `LOG_LEVEL`
 *          environment variable or defaults to `INFO`.
 *
 * @responsibility To provide a concrete implementation of the `Logger` interface that
 *                 directs output to the standard console.
 */
class ConsoleLogger implements Logger {
  /**
   * @constructor
   * @param {LogLevel} [level] - The minimum log level to output. Defaults to the value of the
   *                             `LOG_LEVEL` environment variable, or `LogLevel.INFO` if not set.
   */
  constructor(
    private level: LogLevel = process.env.LOG_LEVEL && !isNaN(Number(process.env.LOG_LEVEL))
      ? Number(process.env.LOG_LEVEL)
      : LogLevel.INFO
  ) {}

  /**
   * @method debug
   * @description Logs a debug-level message to the console if the configured level is appropriate.
   * @param {string} message - The message to log.
   * @param {...any[]} args - Additional data to include in the log output.
   */
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * @method info
   * @description Logs an info-level message to the console if the configured level is appropriate.
   * @param {string} message - The message to log.
   * @param {...any[]} args - Additional data to include in the log output.
   */
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * @method warn
   * @description Logs a warning-level message to the console if the configured level is appropriate.
   * @param {string} message - The message to log.
   * @param {...any[]} args - Additional data to include in the log output.
   */
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * @method error
   * @description Logs an error-level message to the console if the configured level is appropriate.
   * @param {string} message - The message to log.
   * @param {...any[]} args - Additional data to include in the log output.
   */
  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

/**
 * @function createLogger
 * @description A factory function to create a new `ConsoleLogger` instance.
 * @param {LogLevel} [level=LogLevel.INFO] - The desired log level for the new logger.
 * @returns {Logger} A new logger instance.
 *
 * @signature `createLogger(level?: LogLevel): Logger`
 */
export const createLogger = (level: LogLevel = LogLevel.INFO): Logger => {
  return new ConsoleLogger(level);
};

/**
 * @constant logger
 * @description A default, pre-configured logger instance for general application-wide use.
 * @summary This instance is created with the default log level and can be imported directly
 *          by any module that needs to log messages.
 */
export const logger = createLogger();
