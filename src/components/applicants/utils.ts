import {S3} from 'aws-sdk';

export const getApplicantFileURLs = async (
  files: Array<{key: string; value: string}>,
) => {
  const s3 = new S3();
  const promises = files.map((file) => {
    const fileKey = 'applications/' + file.value;
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: fileKey,
      Expires: 100,
    };

    return s3
      .getSignedUrlPromise('getObject', params)
      .then((url) => ({key: file.key, value: url}));
  });

  return Promise.all(promises);
};
