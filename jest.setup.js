const {createAllTables} = require('./src/db/utils');

module.exports = async () => {
  await createAllTables();
};
