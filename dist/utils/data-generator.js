"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDataGenerator = void 0;
const faker_1 = require("@faker-js/faker");
class UserDataGenerator {
    options;
    defaultOptions = {
        minAge: 18,
        maxAge: 80,
        minFollowers: 0,
        maxFollowers: 100000,
    };
    constructor(options = {}) {
        this.options = options;
        this.options = { ...this.defaultOptions, ...options };
    }
    generateUser() {
        return {
            firstName: faker_1.faker.person.firstName(),
            lastName: faker_1.faker.person.lastName(),
            age: faker_1.faker.number.int({
                min: this.options.minAge,
                max: this.options.maxAge,
            }),
            followersCount: faker_1.faker.number.int({
                min: this.options.minFollowers,
                max: this.options.maxFollowers,
            }),
        };
    }
    generateUsers(count) {
        return Array.from({ length: count }, () => this.generateUser());
    }
    async *generateUsersInBatches(totalCount, batchSize) {
        for (let i = 0; i < totalCount; i += batchSize) {
            const currentBatchSize = Math.min(batchSize, totalCount - i);
            yield this.generateUsers(currentBatchSize);
        }
    }
}
exports.UserDataGenerator = UserDataGenerator;
