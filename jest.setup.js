const {createAllTables} = require('./src/database/utils');

module.exports = async () => {
  await createAllTables();
};
