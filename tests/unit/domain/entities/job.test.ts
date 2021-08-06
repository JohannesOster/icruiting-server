import {createJob} from 'domain/entities/job';
import {v4 as uuid} from 'uuid';

describe('createJob', () => {
  describe('immutability', () => {
    it('returns immutable object', () => {
      const job = createJob({
        tenantId: uuid(),
        jobTitle: 'Apple - CTO',
        jobRequirements: [],
      });
      const setTitle = () => {
        job.jobTitle = 'Apple - CFO';
      };

      expect(setTitle).toThrow();
    });
  });

  describe('uuid handling', () => {
    it('creates uuid for jobRequirements', () => {
      const job = createJob({
        tenantId: uuid(),
        jobTitle: 'Apple - CTO',
        jobRequirements: [{requirementLabel: 'Creativity'}],
      });

      expect(job.jobRequirements[0].jobRequirementId).toBeDefined();
    });
  });
});
