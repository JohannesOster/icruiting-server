import request from 'supertest';
import app from '../app';

describe('GET /', () => {
  it('Returns 404 json error', (done) => {
    request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404, done);
  });
});
