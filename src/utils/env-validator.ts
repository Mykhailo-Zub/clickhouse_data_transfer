import { logger } from "./logger";

interface EnvVariable {
  name: string;
  defaultValue?: string;
  required?: boolean;
  validator?: (value: string) => boolean;
  description?: string;
}

interface ValidationResult {
  value: string;
  isValid: boolean;
  isDefault: boolean;
}

export class EnvValidator {
  private static instance: EnvValidator;
  private validationErrors: string[] = [];
  private validationWarnings: string[] = [];

  private constructor() {}

  static getInstance(): EnvValidator {
    if (!EnvValidator.instance) {
      EnvValidator.instance = new EnvValidator();
    }
    return EnvValidator.instance;
  }

  /**
   * Validates and retrieves environment variable value
   */
  getString(config: EnvVariable): string {
    const result = this.validateVariable(config);

    if (!result.isValid) {
      const errorMsg = `Environment variable ${config.name} is invalid`;
      this.validationErrors.push(errorMsg);
      logger.error(errorMsg, {
        provided: process.env[config.name],
        description: config.description,
      });
    }

    if (result.isDefault && config.required) {
      const warnMsg = `Using default value for required environment variable ${config.name}`;
      this.validationWarnings.push(warnMsg);
      logger.warn(warnMsg, {
        defaultValue: result.value,
        description: config.description,
      });
    }

    return result.value;
  }

  /**
   * Validates and retrieves integer environment variable
   */
  getInteger(config: EnvVariable & { defaultValue: string }): number {
    const stringValue = this.getString({
      ...config,
      validator: (value: string) => {
        const num = parseInt(value, 10);
        return !isNaN(num) && num > 0;
      },
    });

    const result = parseInt(stringValue, 10);

    if (isNaN(result) || result <= 0) {
      const errorMsg = `Environment variable ${config.name} must be a positive integer`;
      this.validationErrors.push(errorMsg);
      logger.error(errorMsg, {
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
  private validateVariable(config: EnvVariable): ValidationResult {
    const envValue = process.env[config.name];

    // Check if variable exists
    if (!envValue) {
      if (config.required && !config.defaultValue) {
        this.validationErrors.push(`Required environment variable ${config.name} is missing`);
        logger.error(`Required environment variable ${config.name} is missing`, {
          description: config.description,
        });
        return { value: "", isValid: false, isDefault: false };
      }

      if (config.defaultValue) {
        logger.info(`Environment variable ${config.name} not set, using default value`, {
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
  hasErrors(): boolean {
    return this.validationErrors.length > 0;
  }

  /**
   * Gets all validation errors
   */
  getErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Gets all validation warnings
   */
  getWarnings(): string[] {
    return [...this.validationWarnings];
  }

  /**
   * Logs validation summary
   */
  logValidationSummary(): void {
    if (this.validationErrors.length > 0) {
      logger.error("Environment validation failed:", {
        errors: this.validationErrors.length,
        warnings: this.validationWarnings.length,
      });
      this.validationErrors.forEach((error) => logger.error(`❌ ${error}`));
    }

    if (this.validationWarnings.length > 0) {
      logger.warn("Environment validation warnings:", {
        warnings: this.validationWarnings.length,
      });
      this.validationWarnings.forEach((warning) => logger.warn(`⚠️ ${warning}`));
    }

    if (this.validationErrors.length === 0 && this.validationWarnings.length === 0) {
      logger.info("✅ Environment validation passed");
    }
  }

  /**
   * Resets validation state
   */
  reset(): void {
    this.validationErrors = [];
    this.validationWarnings = [];
  }
}

export const envValidator = EnvValidator.getInstance();
