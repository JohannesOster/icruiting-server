import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {selectScreeningRanking} from '../../db/rankings.db';

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
  } else
    throw new Error(`${formCategory} as form_category is not yet implemented!`);
};
