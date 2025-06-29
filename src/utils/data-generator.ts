import { faker } from "@faker-js/faker";
import { User } from "../types/index";

export interface DataGeneratorOptions {
  minAge?: number;
  maxAge?: number;
  minFollowers?: number;
  maxFollowers?: number;
}

export class UserDataGenerator {
  private readonly defaultOptions: Required<DataGeneratorOptions> = {
    minAge: 18,
    maxAge: 80,
    minFollowers: 0,
    maxFollowers: 100000,
  };

  constructor(private options: DataGeneratorOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

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
    };
  }

  generateUsers(count: number): User[] {
    return Array.from({ length: count }, () => this.generateUser());
  }

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
