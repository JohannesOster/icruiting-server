import {BaseError, httpReqHandler} from 'adapters/errorHandling';
import {createFormSubmission} from 'domain/entities';
import db from 'infrastructure/db';

export const FormSubmissionsAdapter = () => {
  const create = httpReqHandler(async (req) => {
    const {userId, tenantId} = req.user;
    const params = {...req.body, submitterId: userId, tenantId};
    const resp = await db.formSubmissions.create(params);
    return {status: 201, body: resp};
  });

  const retrieve = httpReqHandler(async (req) => {
    const {userId, tenantId} = req.user;
    const {formId, applicantId} = req.params;
    const params = {formId, applicantId, submitterId: userId, tenantId};
    const resp = await db.formSubmissions.retrieve(params);
    if (!resp) throw new BaseError(404, 'Not Found');
    return {body: resp};
  });

  const update = httpReqHandler(async (req) => {
    const {tenantId, userId} = req.user;
    const {formSubmissionId} = req.params;
    const {submission, applicantId, formId} = req.body;
    const resp = await db.formSubmissions.update(
      createFormSubmission({
        tenantId,
        formId,
        applicantId,
        formSubmissionId,
        submission,
        submitterId: userId,
      }),
    );
    return {body: resp};
  });

  return {create, retrieve, update};
};
