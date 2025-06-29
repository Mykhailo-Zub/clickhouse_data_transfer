"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clickhouseConfig = exports.elasticsearchConfig = void 0;
require("dotenv/config");
const env_validator_1 = require("../utils/env-validator");
// URL validation function
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
// Database/Table/Index name validation function
const isValidName = (name) => {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && name.length > 0;
};
exports.elasticsearchConfig = {
    node: env_validator_1.envValidator.getString({
        name: "ELASTIC_NODE",
        defaultValue: "http://localhost:9200",
        required: true,
        validator: isValidUrl,
        description: "Elasticsearch node URL",
    }),
    index: env_validator_1.envValidator.getString({
        name: "ELASTIC_INDEX",
        defaultValue: "users",
        required: true,
        validator: isValidName,
        description: "Elasticsearch index name",
    }),
};
exports.clickhouseConfig = {
    host: env_validator_1.envValidator.getString({
        name: "CLICKHOUSE_HOST",
        defaultValue: "http://localhost:8123",
        required: true,
        validator: isValidUrl,
        description: "ClickHouse HTTP interface URL",
    }),
    database: env_validator_1.envValidator.getString({
        name: "CLICKHOUSE_DATABASE",
        defaultValue: "default",
        required: true,
        validator: isValidName,
        description: "ClickHouse database name",
    }),
    table: env_validator_1.envValidator.getString({
        name: "CLICKHOUSE_TABLE",
        defaultValue: "users",
        required: true,
        validator: isValidName,
        description: "ClickHouse table name",
    }),
};
