import "dotenv/config";
import { envValidator } from "../utils/env-validator";

export interface ElasticsearchConfig {
  node: string;
  index: string;
}

export interface ClickHouseConfig {
  host: string;
  database: string;
  table: string;
}

// URL validation function
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Database/Table/Index name validation function
const isValidName = (name: string): boolean => {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && name.length > 0;
};

export const elasticsearchConfig: ElasticsearchConfig = {
  node: envValidator.getString({
    name: "ELASTIC_NODE",
    defaultValue: "http://localhost:9200",
    required: true,
    validator: isValidUrl,
    description: "Elasticsearch node URL",
  }),
  index: envValidator.getString({
    name: "ELASTIC_INDEX",
    defaultValue: "users",
    required: true,
    validator: isValidName,
    description: "Elasticsearch index name",
  }),
};

export const clickhouseConfig: ClickHouseConfig = {
  host: envValidator.getString({
    name: "CLICKHOUSE_HOST",
    defaultValue: "http://localhost:8123",
    required: true,
    validator: isValidUrl,
    description: "ClickHouse HTTP interface URL",
  }),
  database: envValidator.getString({
    name: "CLICKHOUSE_DATABASE",
    defaultValue: "default",
    required: true,
    validator: isValidName,
    description: "ClickHouse database name",
  }),
  table: envValidator.getString({
    name: "CLICKHOUSE_TABLE",
    defaultValue: "users",
    required: true,
    validator: isValidName,
    description: "ClickHouse table name",
  }),
};
