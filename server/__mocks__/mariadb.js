// Mock mariadb module for Jest tests
const mariadb = {
  createConnection: jest.fn(),
  createPool: jest.fn(),
  SqlError: class SqlError extends Error {}
};

module.exports = mariadb;
