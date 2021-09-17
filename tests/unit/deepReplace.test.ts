import {deepReplace} from 'modules/jobs/application/utils';

describe('deepReplace', () => {
  it('replaces values correctly', () => {
    const replace = {old1: 'new1', old2: 'new2', old3: 'new3', old4: 'new4'};
    const obj = {
      jobRequirements: [
        {jobRequirementId: 'old1', requirementLabel: 'label1'},
        {jobRequirementId: 'old2', requirementLabel: 'label2'},
      ],
      forms: [{formId: 'old3'}, {formId: 'old4', replicaOf: 'old3'}],
    };

    const expected = {
      jobRequirements: [
        {jobRequirementId: 'new1', requirementLabel: 'label1'},
        {jobRequirementId: 'new2', requirementLabel: 'label2'},
      ],
      forms: [{formId: 'new3'}, {formId: 'new4', replicaOf: 'new3'}],
    };

    expect(deepReplace(obj, replace)).toStrictEqual(expected);
  });
});
