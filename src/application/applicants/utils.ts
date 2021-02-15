import {S3} from 'aws-sdk';
import {File} from 'domain/entities';

export const getApplicantFileURLs = async (files?: File[]) => {
  const s3 = new S3();
  const bucket = process.env.S3_BUCKET;

  const promises = files?.map((file) => {
    const fileKey = file.uri;
    const params = {Bucket: bucket, Key: fileKey, Expires: 100};
    return s3
      .getSignedUrlPromise('getObject', params)
      .then((uri) => ({formFieldId: file.formFieldId, uri}));
  });

  return Promise.all(promises || []);
};
