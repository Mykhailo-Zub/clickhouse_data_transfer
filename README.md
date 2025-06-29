# Elasticsearch to ClickHouse Data Transfer Demo

A data migration system between Elasticsearch and ClickHouse built with TypeScript, Docker, and comprehensive testing.

## 🎯 Overview

This application demonstrates a complete data pipeline solution that:

1. **Seeds** mock user data into Elasticsearch
2. **Migrates** data from Elasticsearch to ClickHouse in configurable batches
3. **Validates** data integrity throughout the process
4. **Provides** comprehensive logging and error handling
5. **Includes** environment variable validation with sensible defaults

## ✨ Features

- **🔄 Bidirectional Data Operations**: Comprehensive CRUD operations for both Elasticsearch and ClickHouse
- **📊 Batch Processing**: Configurable batch sizes for optimal performance
- **🔍 Data Validation**: Automatic verification of migration integrity
- **📝 Comprehensive Logging**: Detailed logging with multiple log levels
- **🧪 Full Test Coverage**: Integration tests covering all scenarios
- **🛡️ Environment Validation**: Robust validation of configuration with helpful error messages
- **🔌 Docker Integration**: Ready-to-run with Docker Compose
- **📈 Progress Tracking**: Real-time migration progress monitoring
- **🎯 TypeScript**: Fully typed for better development experience

## 🚀 Quick Start

### 0. Prerequisites

- Node.js 18+
- Docker & Docker Compose

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables (optional)

All environment variables are **optional** and have sensible defaults. Copy `.env.example` to `.env` to customize:

```bash
cp .env.example .env
```

**Available Environment Variables:**

| Variable              | Default                 | Description                      |
| --------------------- | ----------------------- | -------------------------------- |
| `ELASTIC_NODE`        | `http://localhost:9200` | Elasticsearch node URL           |
| `ELASTIC_INDEX`       | `users`                 | Elasticsearch index name         |
| `CLICKHOUSE_HOST`     | `http://localhost:8123` | ClickHouse HTTP interface URL    |
| `CLICKHOUSE_DATABASE` | `default`               | ClickHouse database name         |
| `CLICKHOUSE_TABLE`    | `users`                 | ClickHouse table name            |
| `MOCK_USERS_COUNT`    | `10000`                 | Number of mock users to generate |
| `BATCH_SIZE`          | `1000`                  | Batch size for data processing   |
| `LOG_LEVEL`           | `1`                     | Logging level                    |

### 3. Start Services

Run the following command to start the Elasticsearch, Kibana, and ClickHouse containers in the background:

```bash
docker-compose up -d
```

- **Elasticsearch** will be available at `http://localhost:9200`.
- **Kibana** (web UI for Elasticsearch) will be available at `http://localhost:5601`.
- **ClickHouse** (HTTP interface) will be available at `http://localhost:8123`.

Wait a minute for the services to become fully operational. You can check their status with `docker-compose ps`.

## 🛠️ Usage

This project supports two modes for running scripts:

- **Development Mode**: Uses `ts-node` to run TypeScript files directly. Ideal for development.
- **Production Mode**: First compiles TypeScript to JavaScript (`npm run build`), then runs the compiled files. This is faster for repeated execution.

### 1. Seed Elasticsearch

- **Development:**
  ```bash
  npm run dev:seed
  ```
- **Production:**
  ```bash
  npm run build
  npm run seed
  ```

You can verify the data has been loaded by sending a request to Elasticsearch at `http://localhost:9200` and exploring the `hits.total.value` field:

```bash
curl -X GET 'http://localhost:9200/users/_search?pretty' -H 'Content-Type: application/json' -d '
{
  "track_total_hits": true,
  "query": {
    "match_all": {}
  }
}
'
```

### 2. Migrate Data to ClickHouse

- **Development:**
  ```bash
  npm run dev:migrate
  ```
- **Production:**
  ```bash
  npm run build
  npm run start
  ```

The script will create the table if it doesn't exist, truncate it if it does, and perform the migration, verifying the counts at the end.

You can verify the data has been loaded by sending a request to ClickHouse at `http://localhost:8123` and exploring the `data` array:

```bash
curl -X POST 'http://localhost:8123' -d 'SELECT count() FROM default.users FORMAT JSON;'
```

### 3. Run Tests

To ensure the migration logic is working correctly, you can run the comprehensive integration test suite:

```bash
npm run test
```

The tests cover:

- Repository operations (CRUD)
- Data seeding functionality
- Migration integrity validation
- Error handling scenarios

## 🏗️ Architecture

The application follows clean architecture principles:

```
src/
├── config/             # Configuration with validation
├── factories/          # Factory patterns for clients
├── repositories/       # Data access layer
├── services/           # Business logic layer
├── scripts/            # Executable scripts
├── tests/              # Comprehensive test suite
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Components

1. **Environment Validator** (`src/utils/env-validator.ts`):

   - Validates all environment variables
   - Provides sensible defaults
   - Comprehensive error reporting
   - Type-safe value conversion

2. **Configuration System** (`src/config/`):

   - Centralized configuration management
   - Automatic validation on startup
   - Type-safe configuration objects

3. **Repository Pattern**: Clean data access with proper error handling
4. **Service Layer**: Business logic separation with comprehensive logging
5. **Factory Pattern**: Consistent client creation and configuration

### Logging Levels

The application supports multiple logging levels:

- `DEBUG`: Detailed debugging information
- `INFO`: General information (default)
- `WARN`: Warning messages
- `ERROR`: Error messages

Set the log level by modifying the logger creation in your code.

## 🧹 Cleanup

To stop and remove the Docker containers and their volumes, run:

```bash
docker-compose down -v
```

## 📝 Notes

- The application validates all environment variables on startup
- Invalid configurations will cause the application to exit with helpful error messages
- All databases/indices are created automatically if they don't exist
- The migration process includes data integrity verification
- Progress is logged in real-time during operations
- Both TypeScript source and compiled JavaScript versions are supported

## 📄 License

This project is licensed under the MIT License.
