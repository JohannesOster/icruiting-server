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
        {key: random.alphaNumeric(), value: image.imageUrl()},
        {key: random.alphaNumeric(), value: image.imageUrl()},
        {key: random.alphaNumeric(), value: image.imageUrl()},
      ];

      const expectedResult = files.map((file) => ({
        key: file.key,
        value: mockURL,
      }));
      const resp = await getApplicantFileURLs(files);

      expect(resp).toStrictEqual(expectedResult);
    });
  });
});
