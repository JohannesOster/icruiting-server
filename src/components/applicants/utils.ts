import {S3} from 'aws-sdk';

const s3 = new S3();

export const getApplicantFileURLs = async (
  files: Array<{key: string; value: string}>,
) => {
  const promises = files.map((file) => {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: 'applications/' + file.value,
      Expires: 100,
    };

    return s3
      .getSignedUrlPromise('getObject', params)
      .then((url) => ({key: file.key, value: url}));
  });

  return Promise.all(promises);
};
