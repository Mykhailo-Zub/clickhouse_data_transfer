import "dotenv/config";
import { envValidator } from "../utils/env-validator";

/**
 * @interface ElasticsearchConfig
 * @description Defines the configuration structure for connecting to an Elasticsearch instance.
 *              This includes the node URL and the name of the index to be used for storing and querying user data.
 *
 * @property {string} node - The URL of the Elasticsearch node. This should be a valid HTTP or HTTPS URL.
 * @property {string} index - The name of the Elasticsearch index where user data is stored.
 */
export interface ElasticsearchConfig {
  node: string;
  index: string;
}

/**
 * @interface ClickHouseConfig
 * @description Defines the configuration for connecting to a ClickHouse database.
 *              It specifies the host, database name, and table name for operations.
 *
 * @property {string} host - The URL of the ClickHouse HTTP interface.
 * @property {string} database - The name of the database to connect to within ClickHouse.
 * @property {string} table - The name of the table to be used for storing user data.
 */
export interface ClickHouseConfig {
  host: string;
  database: string;
  table: string;
}

/**
 * @function isValidUrl
 * @description Validates if the provided string is a well-formed URL.
 *              This utility function is used to ensure that connection strings for services like Elasticsearch and ClickHouse are valid before use.
 *
 * @param {string} url - The URL string to validate.
 * @returns {boolean} - Returns `true` if the URL is valid, otherwise `false`.
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * @function isValidName
 * @description Validates if the provided string is a valid name for a database, table, or index.
 *              It checks that the name starts with a letter or underscore, followed by alphanumeric characters or underscores,
 *              and is not empty.
 *
 * @param {string} name - The name string to validate.
 * @returns {boolean} - Returns `true` if the name is valid according to the regex, otherwise `false`.
 */
const isValidName = (name: string): boolean => {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && name.length > 0;
};

/**
 * @constant elasticsearchConfig
 * @description Provides the configuration for the Elasticsearch client, sourced from environment variables.
 *              This object contains the necessary settings to connect to the Elasticsearch cluster, including node URL and index name.
 *              It uses `envValidator` to fetch and validate these settings.
 *
 * @property {string} node - The Elasticsearch node URL, from `ELASTIC_NODE` env var.
 * @property {string} index - The Elasticsearch index name, from `ELASTIC_INDEX` env var.
 */
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

/**
 * @constant clickhouseConfig
 * @description Provides the configuration for the ClickHouse client, sourced from environment variables.
 *              This object contains the host URL, database name, and table name required to interact with the ClickHouse server.
 *              It relies on `envValidator` for loading and validating these configuration values.
 *
 * @property {string} host - The ClickHouse HTTP interface URL, from `CLICKHOUSE_HOST` env var.
 * @property {string} database - The ClickHouse database name, from `CLICKHOUSE_DATABASE` env var.
 * @property {string} table - The ClickHouse table name, from `CLICKHOUSE_TABLE` env var.
 */
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
