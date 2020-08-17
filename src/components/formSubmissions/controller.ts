import {RequestHandler} from 'express';
import {
  dbSelectFormSubmission,
  dbInsertFormSubmission,
  dbUpdateFormSubmission,
} from './database';

export const getFormSubmissions: RequestHandler = (req, res, next) => {
  const {sub, orgID} = res.locals.user;
  const {form_id, applicant_id} = req.params;
  const params = {
    form_id,
    applicant_id,
    submitter_id: sub,
    organization_id: orgID,
  };
  dbSelectFormSubmission(params)
    .then((data) => res.status(200).json(data))
    .catch(next);
};

export const createFormSubmission: RequestHandler = (req, res, next) => {
  const {sub, orgID} = res.locals.user;
  const params = {...req.body, submitter_id: sub, organization_id: orgID};
  dbInsertFormSubmission(params)
    .then((data) => res.status(201).json(data))
    .catch(next);
};

export const updateFormSubmission: RequestHandler = (req, res, next) => {
  const {sub, orgID} = res.locals.user;
  const {form_id, applicant_id} = req.params;

  const params = {
    ...req.body,
    form_id,
    applicant_id,
    submitter_id: sub,
    organization_id: orgID,
  };
  dbUpdateFormSubmission(params)
    .then((data) => res.status(200).json(data))
    .catch(next);
};
