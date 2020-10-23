import {S3} from 'aws-sdk';
import {
  FormSubmission,
  reduceFormSubmissions,
  KeyValuePair,
} from 'db/repos/utils';

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

interface Params {
  applicantId: string;
  tenantId: string;
  submissions: FormSubmission[];
  normalization: any;
}
export const buildAssessmentReport = ({
  submissions,
  normalization,
  ...other
}: Params) => {
  const [result, reqResult] = reduceFormSubmissions(submissions);

  // build mean for reqProfile
  const reqMeans = Object.entries(reqResult).reduce(
    (acc, [key, {counter, sum}]) => {
      acc.absolute = {...acc.absolute, [key]: sum / counter};

      const normalizer = normalization.find(
        ({jobRequirementLabel}: any) => (jobRequirementLabel = key),
      );
      if (!normalizer) return acc;

      acc.normalized = {
        ...acc.normalized,
        [key]: sum / counter / normalizer.mean,
      };

      return acc;
    },
    {} as KeyValuePair<KeyValuePair<number>>,
  );

  const reqScore = Object.values(reqMeans.absolute).reduce((acc, curr) => {
    return acc + curr;
  }, 0);

  const scoreNormalizer = normalization.reduce((acc: any, {mean}: any) => {
    return acc + mean;
  }, 0);

  return {
    result,
    reqResult: reqMeans.normalized,
    reqResultRaw: reqMeans.absolute,
    reqScore: reqScore / scoreNormalizer,
    normalization,
    ...other,
  };
};
