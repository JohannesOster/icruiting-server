import {S3} from 'aws-sdk';
import {Body, PutObjectRequest} from 'aws-sdk/clients/s3';

export const StorageService = () => {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error('Missing S3 Bucket');

  const getUrl = (path: string) => {
    const urlParams = {Bucket: bucket, Key: path, Expires: 100};
    return new S3().getSignedUrlPromise('getObject', urlParams);
  };

  type UploadParams = {path: string; contentType: string; data: Body};
  const upload = ({path, contentType, data}: UploadParams) => {
    const params = {
      Key: path,
      Bucket: bucket,
      ContentType: contentType,
      Body: data,
    };

    return new S3().upload(params).promise();
  };

  return {getUrl, upload};
};
