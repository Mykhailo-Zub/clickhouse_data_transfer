"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedingService = void 0;
class SeedingService {
    repository;
    dataGenerator;
    logger;
    constructor(repository, dataGenerator, logger) {
        this.repository = repository;
        this.dataGenerator = dataGenerator;
        this.logger = logger;
    }
    async seed(userCount, options = {}) {
        const { cleanup = true, batchSize = 1000, onProgress } = options;
        this.logger.info(`Starting to seed ${userCount} users...`);
        try {
            if (cleanup) {
                await this.repository.create();
            }
            let processedCount = 0;
            for await (const users of this.dataGenerator.generateUsersInBatches(userCount, batchSize)) {
                await this.repository.insert(users);
                processedCount += users.length;
                this.logger.info(`Seeded ${processedCount}/${userCount} users`);
                if (onProgress) {
                    onProgress(processedCount, userCount);
                }
            }
            const finalCount = await this.repository.count();
            this.logger.info(`Seeding completed. Total documents: ${finalCount}`);
        }
        catch (error) {
            this.logger.error(`Seeding failed: ${error}`);
            throw error;
        }
    }
    async getStatus() {
        const exists = await this.repository.exists();
        const count = exists ? await this.repository.count() : 0;
        return { exists, count };
    }
}
exports.SeedingService = SeedingService;
