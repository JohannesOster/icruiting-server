import {S3} from 'aws-sdk';
import {Body} from 'aws-sdk/clients/s3';

export const StorageService = () => {
  const bucket = process.env.S3_BUCKET || '';

  const getUrl = (path: string) => {
    const urlParams = {Bucket: bucket, Key: path, Expires: 3600};
    return new S3()
      .getSignedUrlPromise('getObject', urlParams)
      .catch((err) => {}); // if object does not exist UriParameterError is thrown
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

  const del = (path: string) => {
    return new S3().deleteObject({Key: path, Bucket: bucket}).promise();
  };

  const bulkDel = (paths: string[]) => {
    return Promise.all(paths.map((path) => del(path)));
  };

  const list = async (prefix: string) => {
    const listParams = {Bucket: bucket, Prefix: prefix};
    const {Contents} = await new S3().listObjects(listParams).promise();
    return Contents;
  };

  return {getUrl, upload, del, bulkDel, list};
};
