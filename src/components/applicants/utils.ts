import {S3} from 'aws-sdk';
import {Applicant} from 'db/repos/applicants';

export const getApplicantFileURLs = async (
  files?: {key: string; value: string}[],
) => {
  const s3 = new S3();
  const bucket = process.env.S3_BUCKET;

  const promises = files?.map((file) => {
    const fileKey = file.value;
    const params = {Bucket: bucket, Key: fileKey, Expires: 100};
    return s3
      .getSignedUrlPromise('getObject', params)
      .then((url) => ({key: file.key, value: url}));
  });

  return Promise.all(promises || []);
};

const getAttribute = (applicant: Applicant, attribute: string) => {
  return applicant.attributes.find(({key}) => key === attribute);
};
