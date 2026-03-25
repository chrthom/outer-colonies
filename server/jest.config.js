/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transformIgnorePatterns: ["node_modules/(?!mariadb/)"],
  moduleNameMapper: {
    "^mariadb$": "<rootDir>/__mocks__/mariadb.js"
  }
};
