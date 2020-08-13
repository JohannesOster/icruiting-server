import {RequestHandler} from 'express';
import {validationResult} from 'express-validator';
import {
  insertAssessment as insertAssessmentDb,
  selectAssessment,
  updateAssessment as updateAssessmentDb,
} from '../../db/assessments.db ';

export const insertAssessment: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({errors: errors.array()});

  const submitterId = res.locals.user['sub'];

  insertAssessmentDb({submitter_id: submitterId, ...req.body})
    .then((data) => res.status(201).json(data))
    .catch(next);
};

export const getAssessment: RequestHandler = (req, res, next) => {
  const submitterId = res.locals.user['sub'];
  const applicantId = req.params.applicant_id;
  const {form_id} = req.query as any;

  selectAssessment({
    submitter_id: submitterId,
    applicant_id: applicantId,
    form_id,
  })
    .then((data) => {
      console.log(data, form_id, applicantId);
      res.json(data);
    })
    .catch(next);
};

export const updateAssessment: RequestHandler = (req, res, next) => {
  const submitterId = res.locals.user['sub'];
  const applicantId = req.params.applicant_id;

  updateAssessmentDb({
    ...req.body,
    submitter_id: submitterId,
    applicant_id: applicantId,
  })
    .then((data) => res.json(data))
    .catch(next);
};
