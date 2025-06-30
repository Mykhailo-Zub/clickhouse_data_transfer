import { envValidator } from "../utils/env-validator";

/**
 * @interface AppConfig
 * @description Defines the structure of the application's configuration. It includes settings for data generation and processing,
 *              such as the number of mock users to create and the batch size for database operations. This interface ensures
 *              that the application configuration is type-safe and consistently structured across the application.
 *
 * @property {number} mockUsersCount - The total number of mock users to be generated and seeded into the source database.
 *                                     This value is used by the seeding service to populate the database with initial data.
 * @property {number} batchSize - The number of records to process in a single batch during data migration or other bulk operations.
 *                                This helps in managing memory usage and improving performance of data transfers.
 */
export interface AppConfig {
  mockUsersCount: number;
  batchSize: number;
}

/**
 * @constant appConfig
 * @description Provides the application's configuration settings, sourced from environment variables with sensible defaults.
 *              This configuration object is used throughout the application to access settings like mock data counts and batch sizes.
 *              It utilizes the `envValidator` to ensure that all required environment variables are present and correctly typed.
 *
 * @property {number} mockUsersCount - Sourced from the `MOCK_USERS_COUNT` environment variable. Defaults to 10000.
 *                                     Defines the number of users to generate for seeding purposes.
 * @property {number} batchSize - Sourced from the `BATCH_SIZE` environment variable. Defaults to 1000.
 *                                Defines the size of each batch for data processing operations.
 */
export const appConfig: AppConfig = {
  mockUsersCount: envValidator.getInteger({
    name: "MOCK_USERS_COUNT",
    defaultValue: "10000",
    required: true,
    description: "Number of mock users to generate for seeding",
  }),
  batchSize: envValidator.getInteger({
    name: "BATCH_SIZE",
    defaultValue: "1000",
    required: true,
    description: "Batch size for data processing operations",
  }),
};
