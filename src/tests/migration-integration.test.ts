import { DatabaseClientFactory } from "../factories/database-clients";
import { ElasticsearchUserRepository } from "../repositories/elasticsearch-user.repository";
import { ClickHouseUserRepository } from "../repositories/clickhouse-user.repository";
import { MigrationService } from "../services/migration.service";
import { SeedingService } from "../services/seeding.service";
import { UserDataGenerator } from "../utils/data-generator";
import { createLogger, LogLevel } from "../utils/logger";
import { getConfig } from "../config";
import { User } from "../types/index";

async function collectFromGenerator<T>(generator: AsyncGenerator<T[]>): Promise<T[]> {
  const items: T[] = [];
  for await (const batch of generator) {
    items.push(...batch);
  }
  return items;
}

describe("Data Migration Integration Tests", () => {
  const testLogger = createLogger(LogLevel.WARN); // Reduce noise in tests
  const testIndexName = "test_users";
  const testTableName = "test_users";

  // Get configuration for tests (don't exit on validation errors)
  const config = getConfig(false);

  const clients = DatabaseClientFactory.createClients(
    { ...config.elasticsearch, index: testIndexName },
    { ...config.clickhouse, table: testTableName }
  );

  const esRepository = new ElasticsearchUserRepository(
    clients.elasticsearch,
    testIndexName,
    testLogger
  );

  const chRepository = new ClickHouseUserRepository(
    clients.clickhouse,
    config.clickhouse.database,
    testTableName,
    testLogger
  );

  const dataGenerator = new UserDataGenerator();
  const seedingService = new SeedingService(esRepository, dataGenerator, testLogger);
  const migrationService = new MigrationService(esRepository, chRepository, testLogger);

  const testUsers: User[] = [
    {
      id: "e8a7e5c2-3e5b-4f1e-9b2a-6c2e3a1d4b6f",
      firstName: "John",
      lastName: "Doe",
      age: 30,
      followersCount: 1500,
    },
    {
      id: "a2b3e4d5-6c7d-8e9f-0a1b-2c3d4e5f6a7b",
      firstName: "Jane",
      lastName: "Smith",
      age: 25,
      followersCount: 3000,
    },
    {
      id: "f1e2d3c4-b5a6-7d8e-9f0a-1b2c3d4e5f6a",
      firstName: "Peter",
      lastName: "Jones",
      age: 42,
      followersCount: 500,
    },
  ];

  // Centralized setup and teardown to ensure test isolation
  beforeEach(async () => {
    // Ensure a clean state before each test
    await esRepository.create();
    await chRepository.create();
  });

  afterEach(async () => {
    // Cleanup after each test
    await esRepository.clear();
    await chRepository.clear();
  });

  afterAll(async () => {
    // Final cleanup and close connections
    await clients.elasticsearch.close();
    await clients.clickhouse.close();
  });

  describe("SeedingService", () => {
    test("should seed controlled test data into Elasticsearch", async () => {
      await esRepository.insert(testUsers);
      const count = await esRepository.count();
      expect(count).toBe(testUsers.length);
    });

    test("should generate and seed random users", async () => {
      // The `cleanup: true` is now redundant due to beforeEach/afterEach, but we ensure it works
      await seedingService.seed(10, { cleanup: true });
      const status = await seedingService.getStatus();
      expect(status.exists).toBe(true);
      expect(status.count).toBe(10);
    });
  });

  describe("MigrationService", () => {
    test("should migrate data correctly from Elasticsearch to ClickHouse", async () => {
      await esRepository.insert(testUsers);
      const result = await migrationService.migrate({ batchSize: 2 });

      expect(result.success).toBe(true);
      expect(result.sourceCount).toBe(testUsers.length);
      expect(result.targetCount).toBe(testUsers.length);
      expect(result.durationMs).toBeGreaterThan(0);

      // Verify actual data
      const migratedUsers = await collectFromGenerator(chRepository.findAll());
      expect(migratedUsers).toHaveLength(testUsers.length);

      const sortedOriginal = [...testUsers].sort((a, b) => a.id.localeCompare(b.id));
      const sortedMigrated = [...migratedUsers].sort((a, b) => a.id.localeCompare(b.id));
      expect(sortedMigrated).toEqual(sortedOriginal);
    });

    test("should handle empty source gracefully", async () => {
      // The beforeEach hook ensures the index is empty
      const result = await migrationService.migrate();

      expect(result.success).toBe(true);
      expect(result.sourceCount).toBe(0);
      expect(result.targetCount).toBe(0);
    });

    test("should provide accurate status information", async () => {
      // Index is created but empty from beforeEach
      let status = await migrationService.getStatus();
      expect(status.sourceExists).toBe(true);
      expect(status.sourceCount).toBe(0);
      expect(status.targetExists).toBe(true); // Also created in beforeEach
      expect(status.targetCount).toBe(0);

      await esRepository.insert(testUsers);

      status = await migrationService.getStatus();
      expect(status.sourceExists).toBe(true);
      expect(status.sourceCount).toBe(testUsers.length);
    });
  });

  describe("Repository Integration", () => {
    test("should handle repository operations correctly", async () => {
      // Test Elasticsearch repository
      expect(await esRepository.exists()).toBe(true);
      await esRepository.insert(testUsers.slice(0, 2));
      expect(await esRepository.count()).toBe(2);

      // Test ClickHouse repository
      expect(await chRepository.exists()).toBe(true);
      await chRepository.insert(testUsers);
      expect(await chRepository.count()).toBe(testUsers.length);
      const allUsers = await collectFromGenerator(chRepository.findAll());
      expect(allUsers).toHaveLength(testUsers.length);
    });
  });
});
