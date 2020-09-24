const {createAllTables} = require('./src/db/setup');

module.exports = async () => {
  await createAllTables();
};
