import {RequestHandler} from 'express';
import {
  selectFormSubmission,
  insertFormSubmission,
  updateFormSubmission as updateFormSubmissionDB,
} from '../../db/formSubmissions.db';

export const getFormSubmissions: RequestHandler = (req, res, next) => {
  const {sub, orgID} = res.locals.user;
  const {form_id, applicant_id} = req.params;
  const params = {
    form_id,
    applicant_id,
    submitter_id: sub,
    organization_id: orgID,
  };
  selectFormSubmission(params)
    .then((data) => res.status(200).json(data))
    .catch(next);
};

export const createFormSubmission: RequestHandler = (req, res, next) => {
  const {sub, orgID} = res.locals.user;
  const params = {...req.body, submitter_id: sub, organization_id: orgID};
  insertFormSubmission(params)
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
  updateFormSubmissionDB(params)
    .then((data) => res.status(200).json(data))
    .catch(next);
};
