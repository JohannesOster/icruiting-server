import {BaseError} from 'application/errorHandling';
import {createFormSubmission} from '../domain';
import {httpReqHandler} from 'infrastructure/http/httpReqHandler';
import {DB} from '../infrastructure/repositories';
import {formSubmissionsMapper} from '../mappers';

export const FormSubmissionsAdapter = (db: DB) => {
  const create = httpReqHandler(async (req) => {
    const {userId, tenantId} = req.user;
    const formSubmission = createFormSubmission({
      ...req.body,
      submitterId: userId,
    });
    const params = formSubmissionsMapper.toPersistance(
      tenantId,
      formSubmission,
    );

    const raw = await db.formSubmissions.create(params);
    const body = formSubmissionsMapper.toDTO(tenantId, raw);

    return {status: 201, body};
  });

  const retrieve = httpReqHandler(async (req) => {
    const {userId, tenantId} = req.user;
    const {formId, applicantId} = req.params;
    const params = {formId, applicantId, submitterId: userId, tenantId};
    const resp = await db.formSubmissions.retrieve(params);
    if (!resp) throw new BaseError(404, 'Not Found');

    return {body: formSubmissionsMapper.toDTO(tenantId, resp)};
  });

  const update = httpReqHandler(async (req) => {
    const {tenantId, userId} = req.user;
    const {formSubmissionId} = req.params;

    const formSubmission = createFormSubmission(
      {...req.body, submitterId: userId},
      formSubmissionId,
    );
    const params = formSubmissionsMapper.toPersistance(
      tenantId,
      formSubmission,
    );

    const raw = await db.formSubmissions.update(params);
    const body = formSubmissionsMapper.toDTO(tenantId, raw);

    return {body};
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
        formFieldIndexLookUp[formField.id] = headerFormFields.length - 3; // 2 since it has 2 empty fields at the beginning, 1 since the idx is one lower than the current length, since element was already added

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

    const body = [headerForms, headerFormFields, ...rows].map((row) =>
      row.map(
        (col) =>
          `"${col
            .trim()
            .replace(/\r?\n|\r/g, ' ')
            .trim()}"`,
      ),
    );

    return {body};
  });

  return {create, retrieve, update, del, exportFormSubmission};
};
