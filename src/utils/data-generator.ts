/**
 * @fileoverview
 * This file provides the `UserDataGenerator` class, a utility for creating mock user data.
 * It uses the `@faker-js/faker` library to generate realistic-looking user profiles,
 * which is essential for seeding databases for development and testing purposes.
 * The generator is configurable and can produce data in batches.
 */

import { faker } from "@faker-js/faker";
import { User } from "../types/index";

/**
 * @interface DataGeneratorOptions
 * @description Defines the configuration options for the `UserDataGenerator`.
 *              This allows for customizing the range of values for generated user properties.
 *
 * @property {number} [minAge] - The minimum age for generated users.
 * @property {number} [maxAge] - The maximum age for generated users.
 * @property {number} [minFollowers] - The minimum number of followers for generated users.
 * @property {number} [maxFollowers] - The maximum number of followers for generated users.
 */
export interface DataGeneratorOptions {
  minAge?: number;
  maxAge?: number;
  minFollowers?: number;
  maxFollowers?: number;
}

/**
 * @class UserDataGenerator
 * @description A class responsible for generating mock `User` objects.
 * @summary It leverages the `faker` library to produce individual users or batches of users with realistic,
 *          randomized data. The generation parameters (like age range) are configurable.
 *
 * @responsibility
 * - Generating single mock user objects.
 * - Generating arrays of mock users.
 * - Providing an async generator to produce users in batches for memory-efficient processing.
 */
export class UserDataGenerator {
  /**
   * @private
   * @readonly
   * @property {Required<DataGeneratorOptions>} defaultOptions
   * @description Holds the default configuration values for the data generator.
   */
  private readonly defaultOptions: Required<DataGeneratorOptions> = {
    minAge: 18,
    maxAge: 80,
    minFollowers: 0,
    maxFollowers: 100000,
  };

  /**
   * @constructor
   * @description Initializes a new instance of the `UserDataGenerator`, merging custom options with defaults.
   * @param {DataGeneratorOptions} [options={}] - Custom options to override the default generation parameters.
   */
  constructor(private options: DataGeneratorOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * @method generateUser
   * @description Generates a single mock user object with random data.
   * @returns {User} A new `User` object populated with fake data.
   *
   * @signature `generateUser(): User`
   * @responsibility To create one instance of a user with properties conforming to the `User` interface.
   */
  generateUser(): User {
    return {
      id: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      age: faker.number.int({
        min: this.options.minAge!,
        max: this.options.maxAge!,
      }),
      followersCount: faker.number.int({
        min: this.options.minFollowers!,
        max: this.options.maxFollowers!,
      }),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * @method generateUsers
   * @description Generates an array of mock user objects.
   * @param {number} count - The total number of users to generate.
   * @returns {User[]} An array of `User` objects.
   *
   * @signature `generateUsers(count: number): User[]`
   * @responsibility To create a specified number of user records in a single batch.
   */
  generateUsers(count: number): User[] {
    return Array.from({ length: count }, () => this.generateUser());
  }

  /**
   * @method generateUsersInBatches
   * @description Creates an async generator that yields batches of mock users.
   * @summary This method is memory-efficient for generating very large numbers of users, as it produces
   *          them in smaller chunks rather than all at once.
   *
   * @param {number} totalCount - The total number of users to generate across all batches.
   * @param {number} batchSize - The number of users to include in each generated batch.
   * @returns {AsyncGenerator<User[]>} An async generator that yields arrays of `User` objects.
   *
   * @signature `generateUsersInBatches(totalCount: number, batchSize: number): AsyncGenerator<User[]>`
   * @usage
   * for await (const userBatch of generator.generateUsersInBatches(10000, 500)) {
   *   // process userBatch
   * }
   */
  async *generateUsersInBatches(
    totalCount: number,
    batchSize: number
  ): AsyncGenerator<User[], void, unknown> {
    for (let i = 0; i < totalCount; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, totalCount - i);
      yield this.generateUsers(currentBatchSize);
    }
  }
}
