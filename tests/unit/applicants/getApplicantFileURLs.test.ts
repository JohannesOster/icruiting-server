import {random, image} from 'faker';
import {getApplicantFileURLs} from 'modules/applicants/application/utils';

jest.mock('shared/infrastructure/services/storageService/storageService');

describe('applicants', () => {
  describe('getApplicantFileURLs', () => {
    it('calls S3 getPresigned URL for every file', async () => {
      const files = [
        {formFieldId: random.alphaNumeric(), uri: image.imageUrl()},
        {formFieldId: random.alphaNumeric(), uri: image.imageUrl()},
        {formFieldId: random.alphaNumeric(), uri: image.imageUrl()},
      ];

      const expectedResult = files.map(({formFieldId}) => ({
        formFieldId,
        uri: 'https://mock-signed-url.com',
      }));
      const resp = await getApplicantFileURLs(files);

      expect(resp).toStrictEqual(expectedResult);
    });
  });
});
