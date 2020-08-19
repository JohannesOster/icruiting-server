import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {dbSelectScreeningRanking, dbSelectAssessmentRanking} from './database';
import {TRanking} from './types';
import {sumUpjobRequirementsScore} from './utils';

export const getRanking: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({errors: errors.array()});

  const jobId = req.params.job_id;
  const {orgID: organization_id} = res.locals.user;

  const formCategory = req.query.form_category;
  if (!formCategory) throw new Error('Missing form_category');
  if (formCategory === 'screening') {
    dbSelectScreeningRanking(jobId, organization_id)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  } else if (formCategory === 'assessment') {
    dbSelectAssessmentRanking(jobId, organization_id)
      .then((result: TRanking) => {
        /* Turn requirement_sums_array of objects into object of sums
           {[job_requirement_id]: sum} */
        const tmp = result.map((rankingRow) => {
          const {submissions, ...rest} = rankingRow;
          const sumsObj = sumUpjobRequirementsScore(submissions);
          return {...rest, job_requirements_sum: sumsObj};
        });

        res.status(200).json(tmp);
      })
      .catch(next);
  } else
    throw new Error(`${formCategory} as form_category is not yet implemented!`);
};
