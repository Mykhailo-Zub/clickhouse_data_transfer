import { envValidator } from "../utils/env-validator";

export interface AppConfig {
  mockUsersCount: number;
  batchSize: number;
}

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
