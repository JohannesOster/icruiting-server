import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

import {
  DeleteObjectCommand,
  GetObjectAclCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {Readable} from 'node:stream';
import config from 'config';

export const StorageService = () => {
  console.log('ASDFASDFASDFASD');
  const bucket = config.get('awsS3Bucket');
  const client = new S3Client();

  const getUrl = (path: string) => {
    const params = {Bucket: bucket, Key: path};
    const command = new GetObjectAclCommand(params);
    return getSignedUrl(client, command, {expiresIn: 3600});
  };

  type UploadParams = {path: string; contentType: string; data: Readable};
  const upload = ({path, contentType, data}: UploadParams) => {
    const command = new PutObjectCommand({
      Key: path,
      Bucket: bucket,
      ContentType: contentType,
      Body: data,
    });

    return client.send(command);
  };

  const del = (path: string) => {
    const command = new DeleteObjectCommand({
      Key: path,
      Bucket: bucket,
    });
    return client.send(command);
  };

  const bulkDel = (paths: string[]) => {
    return Promise.all(paths.map((path) => del(path)));
  };

  const list = (prefix: string) => {
    const command = new ListObjectsCommand({
      Bucket: bucket,
      Prefix: prefix,
    });
    return client.send(command).then(({Contents}) => Contents);
  };

  return {getUrl, upload, del, bulkDel, list};
};
