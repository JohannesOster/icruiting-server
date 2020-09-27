import {random, image} from 'faker';
import {getApplicantFileURLs, sortApplicants} from '../utils';

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
  describe('sort applicants', () => {
    it('sorts applicants based on sort key', async () => {
      const sortKey = random.alphaNumeric();
      const base = {
        jobId: random.uuid(),
        tenantId: random.uuid(),
        applicantId: random.uuid(),
        files: [],
        createdAt: Date.now().toString(),
      };
      const applicants = [
        {
          ...base,
          attributes: [
            {key: sortKey, value: 'a'},
            {key: random.alphaNumeric(), value: image.imageUrl()},
            {key: random.alphaNumeric(), value: image.imageUrl()},
          ],
        },
        {
          ...base,
          attributes: [
            {key: sortKey, value: 'c'},
            {key: random.alphaNumeric(), value: image.imageUrl()},
            {key: random.alphaNumeric(), value: image.imageUrl()},
          ],
        },
        {
          ...base,
          attributes: [
            {key: sortKey, value: 'b'},
            {key: random.alphaNumeric(), value: image.imageUrl()},
            {key: random.alphaNumeric(), value: image.imageUrl()},
          ],
        },
      ];

      const expectedResult = applicants.sort((a, b) =>
        a.attributes[0] > b.attributes[0] ? 1 : -1,
      );
      const resp = sortApplicants(applicants, sortKey);
      expect(resp).toStrictEqual(expectedResult);
    });
  });
});
