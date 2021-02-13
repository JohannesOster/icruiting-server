import {BaseError, catchAsync} from 'adapters/errorHandling';
import db from 'infrastructure/db';

export const create = catchAsync(async (req, res) => {
  const {userId, tenantId} = req.user;
  const params = {...req.body, submitterId: userId, tenantId};
  const resp = await db.formSubmissions.create(params);
  res.status(201).json(resp);
});

export const retrieve = catchAsync(async (req, res) => {
  const {userId, tenantId} = req.user;
  const {formId, applicantId} = req.params;
  const params = {formId, applicantId, submitterId: userId, tenantId};
  const resp = await db.formSubmissions.retrieve(params);
  if (!resp) throw new BaseError(404, 'Not Found');
  res.status(200).json(resp);
});

export const update = catchAsync(async (req, res) => {
  const {tenantId} = req.user;
  const {formSubmissionId} = req.params;
  const {submission} = req.body;
  const params = {submission, formSubmissionId, tenantId};
  const resp = await db.formSubmissions.update(params);
  res.status(200).json(resp);
});
