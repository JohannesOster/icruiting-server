const {createAll} = require('../../src/infrastructure/db/setup');

module.exports = async () => {
  await createAll();
};
