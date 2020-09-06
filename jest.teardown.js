const {dropAllTables, endConnection} = require('./src/db/utils');

module.exports = async () => {
  await dropAllTables();
  endConnection();
};
