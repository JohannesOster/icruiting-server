const {dropAll, endConnection} = require('./src/db/setup');

module.exports = async () => {
  await dropAll();
  endConnection();
};
