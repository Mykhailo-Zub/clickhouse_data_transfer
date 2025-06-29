"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseClientFactory = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const client_web_1 = require("@clickhouse/client-web");
class DatabaseClientFactory {
    static createElasticsearchClient(config) {
        return new elasticsearch_1.Client({ node: config.node });
    }
    static createClickHouseClient(config) {
        return (0, client_web_1.createClient)({
            url: config.host,
            database: config.database,
        });
    }
    static createClients(esConfig, chConfig) {
        return {
            elasticsearch: this.createElasticsearchClient(esConfig),
            clickhouse: this.createClickHouseClient(chConfig),
        };
    }
}
exports.DatabaseClientFactory = DatabaseClientFactory;
