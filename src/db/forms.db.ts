import db from '.';
import {
  selectForms as selectFormsSQL,
  selectForm as selectFormSQL,
} from './sql';
import {TForm, TFormSubmission} from 'controllers/forms';

export const insertForm = async ({form_items, ...form}: TForm) => {
  const helpers = db.$config.pgp.helpers;

  // - insert form
  const formStmt = helpers.insert(form, null, 'form') + ' RETURNING *';
  const insertedForm = await db.one(formStmt);

  // - insert form_items
  const cs = new helpers.ColumnSet(
    [
      'form_id',
      'organization_id',
      {name: 'job_requirement_id', def: null},
      'component',
      'row_index',
      'label',
      {name: 'placeholder', def: null},
      {name: 'default_value', def: null},
      {name: 'validation', mod: ':json', cast: 'jsonb', def: null},
      {name: 'options', mod: ':json', cast: 'jsonb', def: null},
      {name: 'editable', def: false},
      {name: 'deletable', def: false},
    ],
    {table: 'form_item'},
  );

  const values = form_items.map((item) => ({
    ...item,
    organization_id: form.organization_id,
    form_id: insertedForm.form_id,
  }));

  const stmt = helpers.insert(values, cs) + ' RETURNING *';

  return db.any(stmt).then((items) => ({...insertedForm, form_items: items}));
};

export const selectForms = (organization_id: string) => {
  return db.any(selectFormsSQL, {organization_id});
};

export const selectForm = (form_id: string) => {
  return db.any(selectFormSQL, {form_id});
};

export const deleteForm = (form_id: string) => {
  const stmt = 'DELETE FROM form WHERE form_id=$1';
  return db.none(stmt, form_id);
};

export const updateForm = async (
  form_id: string,
  {form_items, ...form}: TForm,
) => {
  await db.tx(async (t) => {
    if (form_items) {
      await t.none('DELETE FROM form_item WHERE form_id=$1', form_id);

      const rawText = (text: string) => ({
        toPostgres: () => text,
        rawType: true,
      });

      const cs = new db.$config.pgp.helpers.ColumnSet(
        [
          {
            name: 'form_item_id',
            def: () => rawText('uuid_generate_v4()'),
          }, // insert form_item_id to make shure already existsing form items "only get updated"
          'form_id',
          'organization_id',
          {name: 'job_requirement_id', def: null},
          'component',
          'row_index',
          'label',
          {name: 'placeholder', def: null},
          {name: 'default_value', def: null},
          {name: 'validation', mod: ':json', cast: 'jsonb', def: null},
          {name: 'options', mod: ':json', cast: 'jsonb', def: null},
          {name: 'editable', def: false},
          {name: 'deletable', def: false},
        ],
        {table: 'form_item'},
      );

      const values = form_items.map((item) => ({
        ...item,
        organization_id: form.organization_id,
        form_id,
      }));

      const stmt = db.$config.pgp.helpers.insert(values, cs);
      await t.any(stmt);
    }
  });
  return selectForm(form_id).then((resp) => resp[0]);
};

export const insertFormSubmission = (submission: TFormSubmission) => {
  const helpers = db.$config.pgp.helpers;

  const cs = new helpers.ColumnSet(
    [
      'applicant_id',
      'submitter_id',
      'form_id',
      'organization_id',
      {name: 'submission', mod: ':json', cast: 'jsonb'},
      {name: 'comment', def: null},
    ],
    {table: 'form_submission'},
  );

  const stmt = helpers.insert(submission, cs) + ' RETURNING *';

  return db.one(stmt);
};
