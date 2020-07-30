import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {
  insertScreening as insertScreeningDb,
  selectScreening,
  updateScreening as updateScreeningDb,
} from '../../db/screenings.db';

export const insertScreening: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({errors: errors.array()});

  const submitterId = res.locals.user['sub'];

  insertScreeningDb({submitter_id: submitterId, ...req.body})
    .then((data) => res.status(201).json(data))
    .catch(next);
};

export const getScreening: RequestHandler = (req, res, next) => {
  const submitterId = res.locals.user['sub'];
  const applicantId = req.params.applicant_id;

  selectScreening({submitter_id: submitterId, applicant_id: applicantId})
    .then((data) => res.json(data))
    .catch(next);
};

export const updateScreening: RequestHandler = (req, res, next) => {
  const submitterId = res.locals.user['sub'];
  const applicantId = req.params.applicant_id;

  updateScreeningDb({
    ...req.body,
    submitter_id: submitterId,
    applicant_id: applicantId,
  })
    .then((data) => res.json(data))
    .catch(next);
};
