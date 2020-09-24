import {BaseError, catchAsync} from 'errorHandling';
import {dbSelectScreeningRanking, dbSelectAssessmentRanking} from './database';
import {
  TRankingRow,
  TRankingResultObject,
  EFormItemIntent,
  KeyVal,
} from './types';

export const getRanking = catchAsync(async (req, res) => {
  const jobId = req.params.jobId;
  const {tenantId} = res.locals.user;

  const formCategory = req.query.formCategory;
  let data;
  if (formCategory === 'screening') {
    data = await dbSelectScreeningRanking(jobId, tenantId);
  } else if (formCategory === 'assessment') {
    data = await dbSelectAssessmentRanking(jobId, tenantId);
  } else throw new BaseError(402, `Invalid formCategory: ${formCategory}`);

  const tmp = data.map((row: TRankingRow) => {
    const {submissions} = row;

    const initialValues = (key: EFormItemIntent) => {
      return {
        [EFormItemIntent.sumUp]: 0,
        [EFormItemIntent.aggregate]: [],
        [EFormItemIntent.countDistinct]: {},
      }[key];
    };
    const submissionsResult = submissions.reduce((acc, curr) => {
      curr.forEach(({formFieldId, intent, value, label}) => {
        if (!acc[formFieldId]) {
          const initialVal = initialValues(intent);
          acc[formFieldId] = {label, intent, value: initialVal};
        }
        switch (intent) {
          case EFormItemIntent.sumUp:
            (acc[formFieldId].value as number) += +value;
            break;
          case EFormItemIntent.aggregate:
            const val = value.toString();
            if (!val) break;
            const currArray = acc[formFieldId].value as Array<string>;
            acc[formFieldId].value = currArray.concat(val);
            break;
          case EFormItemIntent.countDistinct:
            const key = value.toString();
            const currVal = (acc[formFieldId].value as KeyVal)[key];
            (acc[formFieldId].value as KeyVal)[key] = (currVal || 0) + 1;
        }
      });

      return acc;
    }, {} as TRankingResultObject);

    return {result: submissionsResult, ...row};
  });

  res.status(200).json(tmp);
});
