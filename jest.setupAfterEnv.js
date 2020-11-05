const faker = require('faker');

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    customers: {
      create: () => Promise.resolve({id: faker.random.uuid()}),
      del: () => Promise.resolve({}),
    },
    subscriptions: {create: () => Promise.resolve({})},
  })),
);

jest.mock('./src/middlewares/stripe');
