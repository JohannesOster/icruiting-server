import {BaseError} from 'application/errorHandling';
import {createFormSubmission} from 'domain/entities';
import db from 'infrastructure/db';
import {httpReqHandler} from 'infrastructure/http/httpReqHandler';

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

  const del = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {formSubmissionId} = req.params;
    await db.formSubmissions.del(tenantId, formSubmissionId);
    return {body: {}};
  });

  const exportFormSubmission = httpReqHandler(async (req) => {
    const {tenantId} = req.user;
    const {jobId, formCategory} = req.query;

    const forms = await db.forms.list(tenantId, {jobId, formCategory});

    // - currently this exports to csv structure, later there might be a format parameter
    const submissions = await db.formSubmissions.list(
      tenantId,
      jobId,
      formCategory,
    );

    const headerForms = ['Bewerber*in', 'SubmitterId'];
    const headerFormFields = ['', ''];
    const formFieldIndexLookUp = {} as any;

    forms.forEach((form) => {
      // Add form title to first row
      headerForms.push(form.formTitle || formCategory);

      form.formFields.forEach((formField) => {
        if (formField.component === 'section_header') return;

        // add field to third row
        headerFormFields.push(formField.label);

        // update lookup table
        formFieldIndexLookUp[formField.formFieldId] =
          headerFormFields.length - 3; // 2 since it has 2 empty fields at the beginning, 1 since the idx is one lower than the current length, since element was already added

        if (headerForms.length > headerFormFields.length - 1) return;
        headerForms.push('');
      });
    });
    const indices: number[] = [];
    const rows = submissions.map((row) => {
      const _row = [row.applicantId, row.submitterId];
      const fill = Array(headerForms.length - 2).fill('');
      Object.entries(row.submission).forEach(
        ([formFieldId, submissionValue]) => {
          const idx = formFieldIndexLookUp[formFieldId];
          indices.push(idx);
          fill[idx] = submissionValue || ''; // to avoid null in row
        },
      );

      return _row.concat(fill);
    });

    const result = [headerForms, headerFormFields, ...rows].map((row) =>
      row.map(
        (col) =>
          `"${col
            .trim()
            .replace(/\r?\n|\r/g, ' ')
            .trim()}"`,
      ),
    );

    return {body: result};
  });

  return {create, retrieve, update, del, exportFormSubmission};
};
