"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidator = exports.EnvValidator = void 0;
const logger_1 = require("./logger");
class EnvValidator {
    static instance;
    validationErrors = [];
    validationWarnings = [];
    constructor() { }
    static getInstance() {
        if (!EnvValidator.instance) {
            EnvValidator.instance = new EnvValidator();
        }
        return EnvValidator.instance;
    }
    /**
     * Validates and retrieves environment variable value
     */
    getString(config) {
        const result = this.validateVariable(config);
        if (!result.isValid) {
            const errorMsg = `Environment variable ${config.name} is invalid`;
            this.validationErrors.push(errorMsg);
            logger_1.logger.error(errorMsg, {
                provided: process.env[config.name],
                description: config.description,
            });
        }
        if (result.isDefault && config.required) {
            const warnMsg = `Using default value for required environment variable ${config.name}`;
            this.validationWarnings.push(warnMsg);
            logger_1.logger.warn(warnMsg, {
                defaultValue: result.value,
                description: config.description,
            });
        }
        return result.value;
    }
    /**
     * Validates and retrieves integer environment variable
     */
    getInteger(config) {
        const stringValue = this.getString({
            ...config,
            validator: (value) => {
                const num = parseInt(value, 10);
                return !isNaN(num) && num > 0;
            },
        });
        const result = parseInt(stringValue, 10);
        if (isNaN(result) || result <= 0) {
            const errorMsg = `Environment variable ${config.name} must be a positive integer`;
            this.validationErrors.push(errorMsg);
            logger_1.logger.error(errorMsg, {
                provided: stringValue,
                description: config.description,
            });
            // Return default as fallback
            return parseInt(config.defaultValue, 10);
        }
        return result;
    }
    /**
     * Validates single environment variable
     */
    validateVariable(config) {
        const envValue = process.env[config.name];
        // Check if variable exists
        if (!envValue) {
            if (config.required && !config.defaultValue) {
                this.validationErrors.push(`Required environment variable ${config.name} is missing`);
                logger_1.logger.error(`Required environment variable ${config.name} is missing`, {
                    description: config.description,
                });
                return { value: "", isValid: false, isDefault: false };
            }
            if (config.defaultValue) {
                logger_1.logger.info(`Environment variable ${config.name} not set, using default value`, {
                    defaultValue: config.defaultValue,
                    description: config.description,
                });
                return { value: config.defaultValue, isValid: true, isDefault: true };
            }
            return { value: "", isValid: false, isDefault: false };
        }
        // Validate value if validator is provided
        if (config.validator && !config.validator(envValue)) {
            return { value: envValue, isValid: false, isDefault: false };
        }
        return { value: envValue, isValid: true, isDefault: false };
    }
    /**
     * Checks if there were any validation errors
     */
    hasErrors() {
        return this.validationErrors.length > 0;
    }
    /**
     * Gets all validation errors
     */
    getErrors() {
        return [...this.validationErrors];
    }
    /**
     * Gets all validation warnings
     */
    getWarnings() {
        return [...this.validationWarnings];
    }
    /**
     * Logs validation summary
     */
    logValidationSummary() {
        if (this.validationErrors.length > 0) {
            logger_1.logger.error("Environment validation failed:", {
                errors: this.validationErrors.length,
                warnings: this.validationWarnings.length,
            });
            this.validationErrors.forEach((error) => logger_1.logger.error(`❌ ${error}`));
        }
        if (this.validationWarnings.length > 0) {
            logger_1.logger.warn("Environment validation warnings:", {
                warnings: this.validationWarnings.length,
            });
            this.validationWarnings.forEach((warning) => logger_1.logger.warn(`⚠️ ${warning}`));
        }
        if (this.validationErrors.length === 0 && this.validationWarnings.length === 0) {
            logger_1.logger.info("✅ Environment validation passed");
        }
    }
    /**
     * Resets validation state
     */
    reset() {
        this.validationErrors = [];
        this.validationWarnings = [];
    }
}
exports.EnvValidator = EnvValidator;
exports.envValidator = EnvValidator.getInstance();
