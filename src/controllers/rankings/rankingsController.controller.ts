import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {
  selectScreeningRanking,
  selectAssessmentRanking,
} from '../../db/rankings.db';

export const getRanking: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({errors: errors.array()});

  const jobId = req.params.job_id;

  const formCategory = req.query.form_category;
  if (!formCategory) throw new Error('Missing form_category');
  if (formCategory === 'screening') {
    selectScreeningRanking(jobId)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  } else if (formCategory === 'assessment') {
    selectAssessmentRanking(jobId)
      .then((result) => {
        /* Turn requirement_sums_array of objects into object of sums
           {[job_requirement_id]: sum} */
        const tmp = result.map((entry) => {
          const {requirement_sums_array, ...rest} = entry;

          const sumsObj = requirement_sums_array.reduce(
            (acc: any, obj: any) => {
              Object.entries(obj).forEach(([key, value]) => {
                acc[key] = !!acc[key] ? acc[key] + value : value;
              });

              return acc;
            },
          );

          return {...rest, job_requirements_sum: sumsObj};
        });
        res.status(200).json(tmp);
      })
      .catch(next);
  } else
    throw new Error(`${formCategory} as form_category is not yet implemented!`);
};
