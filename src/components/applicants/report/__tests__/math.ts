import _ from 'lodash';
import {calcReport} from '../report';
import data from './__mocks__/data';

describe('math', () => {
  describe('formFieldScore', () => {
    it('does what it should', () => {
      const res = calcReport(data, 'uhfzsE'); // the first applicant
      console.log(res);
    });
  });
});
