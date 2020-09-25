import {random, image} from 'faker';
import {getApplicantFileURLs, sortApplicants, round} from '../utils';

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
  describe('round', () => {
    it('rounds default to 2 digits', () => {
      const numb = 1.234;
      const result = round(numb);
      expect(result).toBe(1.23);
    });
    it('rounds default to provided digits', () => {
      const numb = 1.2345678;
      const result = round(numb, 3);
      expect(result).toBe(1.235);
    });
  });
});
