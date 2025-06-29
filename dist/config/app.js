"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const env_validator_1 = require("../utils/env-validator");
exports.appConfig = {
    mockUsersCount: env_validator_1.envValidator.getInteger({
        name: "MOCK_USERS_COUNT",
        defaultValue: "10000",
        required: true,
        description: "Number of mock users to generate for seeding",
    }),
    batchSize: env_validator_1.envValidator.getInteger({
        name: "BATCH_SIZE",
        defaultValue: "1000",
        required: true,
        description: "Batch size for data processing operations",
    }),
};
