import {random, image} from 'faker';
import {getApplicantFileURLs} from 'adapters/applicants/utils';

const mockURL = image.imageUrl();
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    getSignedUrlPromise: () => Promise.resolve(mockURL),
  })),
}));

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
        uri: mockURL,
      }));
      const resp = await getApplicantFileURLs(files);

      expect(resp).toStrictEqual(expectedResult);
    });
  });
});
