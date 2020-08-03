const {dropAllTables, endConnection} = require('./src/db/utils');
const {default: db} = require('./src/db');

module.exports = async () => {
  await dropAllTables();
  endConnection();
};
