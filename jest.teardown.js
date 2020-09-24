const {dropAllTables, endConnection} = require('./src/db/setup');

module.exports = async () => {
  await dropAllTables();
  endConnection();
};
