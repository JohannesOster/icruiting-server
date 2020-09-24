const {dropAllTables, endConnection} = require('./src/database/utils');

module.exports = async () => {
  await dropAllTables();
  endConnection();
};
