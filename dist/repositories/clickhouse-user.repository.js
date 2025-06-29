"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickHouseUserRepository = void 0;
class ClickHouseUserRepository {
    client;
    database;
    tableName;
    logger;
    constructor(client, database, tableName, logger) {
        this.client = client;
        this.database = database;
        this.tableName = tableName;
        this.logger = logger;
    }
    get fullTableName() {
        return `${this.database}.${this.tableName}`;
    }
    async exists() {
        try {
            const result = await this.client.query({
                query: `EXISTS TABLE ${this.fullTableName}`,
                format: "JSONEachRow",
            });
            const data = await result.json();
            const rows = Array.isArray(data) ? data : [data];
            return rows.length > 0 && rows[0].result === 1;
        }
        catch (error) {
            this.logger.error(`Error checking if table exists: ${error}`);
            throw error;
        }
    }
    async create() {
        try {
            const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${this.fullTableName}
        (
          firstName String,
          lastName String,
          age UInt8,
          followersCount UInt32
        )
        ENGINE = MergeTree()
        ORDER BY (firstName, lastName)
      `;
            await this.client.exec({ query: createTableQuery });
            this.logger.info(`Table "${this.fullTableName}" created or already exists`);
        }
        catch (error) {
            this.logger.error(`Error creating table: ${error}`);
            throw error;
        }
    }
    async clear() {
        try {
            const tableExists = await this.exists();
            if (tableExists) {
                await this.client.exec({
                    query: `TRUNCATE TABLE ${this.fullTableName}`,
                });
                this.logger.info(`Table "${this.fullTableName}" cleared`);
            }
        }
        catch (error) {
            this.logger.error(`Error clearing table: ${error}`);
            throw error;
        }
    }
    async insert(users) {
        if (users.length === 0)
            return;
        try {
            await this.client.insert({
                table: this.tableName,
                values: users,
                format: "JSONEachRow",
            });
            this.logger.debug(`Inserted ${users.length} users into ClickHouse`);
        }
        catch (error) {
            this.logger.error(`Error inserting users: ${error}`);
            throw error;
        }
    }
    async count() {
        try {
            const result = await this.client.query({
                query: `SELECT count() as count FROM ${this.fullTableName}`,
                format: "JSONEachRow",
            });
            const data = await result.json();
            const rows = Array.isArray(data) ? data : [data];
            return parseInt(rows[0].count, 10) || 0;
        }
        catch (error) {
            this.logger.error(`Error counting records: ${error}`);
            throw error;
        }
    }
    async *findAll(batchSize = 1000) {
        try {
            const stream = (await this.client.query({
                query: `SELECT * FROM ${this.fullTableName} ORDER BY firstName`,
                format: "JSONEachRow",
            })).stream();
            let buffer = [];
            for await (const rows of stream) {
                const users = rows.map((row) => row.json());
                buffer.push(...users);
                while (buffer.length >= batchSize) {
                    yield buffer.slice(0, batchSize);
                    buffer = buffer.slice(batchSize);
                }
            }
            if (buffer.length > 0) {
                yield buffer;
            }
        }
        catch (error) {
            this.logger.error(`Error finding all users: ${error}`);
            throw error;
        }
    }
}
exports.ClickHouseUserRepository = ClickHouseUserRepository;
