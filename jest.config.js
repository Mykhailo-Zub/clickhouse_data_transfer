/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  testTimeout: 60000,
  testMatch: ["**/src/**/*.test.ts"],
};
