import { Client as ElasticClient } from "@elastic/elasticsearch";
import { createClient, ClickHouseClient } from "@clickhouse/client-web";
import { ElasticsearchConfig, ClickHouseConfig } from "../config/database";

export interface DatabaseClients {
  elasticsearch: ElasticClient;
  clickhouse: ClickHouseClient;
}

export class DatabaseClientFactory {
  static createElasticsearchClient(config: ElasticsearchConfig): ElasticClient {
    return new ElasticClient({ node: config.node });
  }

  static createClickHouseClient(config: ClickHouseConfig): ClickHouseClient {
    return createClient({
      url: config.host,
      database: config.database,
    });
  }

  static createClients(esConfig: ElasticsearchConfig, chConfig: ClickHouseConfig): DatabaseClients {
    return {
      elasticsearch: this.createElasticsearchClient(esConfig),
      clickhouse: this.createClickHouseClient(chConfig),
    };
  }
}
