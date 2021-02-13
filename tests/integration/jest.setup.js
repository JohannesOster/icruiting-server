const {createAll} = require('../../src/db/setup');

module.exports = async () => {
  await createAll();
};
