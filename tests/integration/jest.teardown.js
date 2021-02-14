const {dropAll, endConnection} = require('../../src/infrastructure/db/setup');

module.exports = async () => {
  await dropAll();
  endConnection();
};
