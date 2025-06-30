/**
 * @fileoverview
 * This file defines a factory (`DatabaseClientFactory`) for creating and managing database client instances.
 * It abstracts the instantiation logic for Elasticsearch and ClickHouse clients, making it easy to create
 * configured client objects based on the application's configuration. This promotes separation of concerns
 * and simplifies client management across the application.
 */

import { Client as ElasticClient } from "@elastic/elasticsearch";
import { createClient, ClickHouseClient } from "@clickhouse/client-web";
import { ElasticsearchConfig, ClickHouseConfig } from "../config/database";

/**
 * @interface DatabaseClients
 * @description Defines a container for holding instances of all database clients used in the application.
 *              This provides a single, structured object to pass around, which contains active connections
 *              to all necessary databases.
 *
 * @property {ElasticClient} elasticsearch - An active client instance for interacting with Elasticsearch.
 * @property {ClickHouseClient} clickhouse - An active client instance for interacting with ClickHouse.
 */
export interface DatabaseClients {
  elasticsearch: ElasticClient;
  clickhouse: ClickHouseClient;
}

/**
 * @class DatabaseClientFactory
 * @description A factory class responsible for creating instances of database clients.
 *              It uses the provided configuration to instantiate and return clients for Elasticsearch and ClickHouse.
 *              This class centralizes client creation logic, making it easier to manage and test.
 */
export class DatabaseClientFactory {
  /**
   * @method createElasticsearchClient
   * @description Creates and configures an Elasticsearch client instance.
   * @static
   *
   * @param {ElasticsearchConfig} config - The Elasticsearch configuration object containing the node URL.
   * @returns {ElasticClient} A new instance of the Elasticsearch client, connected to the specified node.
   *
   * @signature `static createElasticsearchClient(config: ElasticsearchConfig): ElasticClient`
   *
   * @responsibility To abstract the instantiation of the Elasticsearch client.
   *
   * @usage
   * const esClient = DatabaseClientFactory.createElasticsearchClient({ node: 'http://localhost:9200' });
   */
  static createElasticsearchClient(config: ElasticsearchConfig): ElasticClient {
    return new ElasticClient({ node: config.node });
  }

  /**
   * @method createClickHouseClient
   * @description Creates and configures a ClickHouse client instance.
   * @static
   *
   * @param {ClickHouseConfig} config - The ClickHouse configuration object, containing the host and database name.
   * @returns {ClickHouseClient} A new instance of the ClickHouse client.
   *
   * @signature `static createClickHouseClient(config: ClickHouseConfig): ClickHouseClient`
   *
   * @responsibility To abstract the instantiation of the ClickHouse client.
   *
   * @usage
   * const chClient = DatabaseClientFactory.createClickHouseClient({ host: 'http://localhost:8123', database: 'default' });
   */
  static createClickHouseClient(config: ClickHouseConfig): ClickHouseClient {
    return createClient({
      url: config.host,
      database: config.database,
    });
  }

  /**
   * @method createClients
   * @description A convenience method to create all required database clients at once.
   * @static
   *
   * @param {ElasticsearchConfig} esConfig - The configuration for the Elasticsearch client.
   * @param {ClickHouseConfig} chConfig - The configuration for the ClickHouse client.
   * @returns {DatabaseClients} An object containing initialized instances of all database clients.
   *
   * @signature `static createClients(esConfig: ElasticsearchConfig, chConfig: ClickHouseConfig): DatabaseClients`
   *
   * @responsibility To provide a single entry point for creating all database clients needed by the application.
   *
   * @usage
   * const clients = DatabaseClientFactory.createClients(esConfig, chConfig);
   * // clients.elasticsearch and clients.clickhouse are now available.
   */
  static createClients(esConfig: ElasticsearchConfig, chConfig: ClickHouseConfig): DatabaseClients {
    return {
      elasticsearch: this.createElasticsearchClient(esConfig),
      clickhouse: this.createClickHouseClient(chConfig),
    };
  }
}
