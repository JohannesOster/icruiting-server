import {getReport} from './report';
import mock from './data';

describe('getReport', () => {
  it('does what it should', () => {
    const res = getReport(mock, 'd4a59539-5418-488b-8028-1e60e9f6a637');
  });
});
