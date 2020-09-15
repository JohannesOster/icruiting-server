import db from 'db';
import {
  selectForms as selectFormsSQL,
  selectForm as selectFormSQL,
} from './sql';
import {TForm} from './types';

export const dbInsertForm = async ({form_fields, ...form}: TForm) => {
  const helpers = db.$config.pgp.helpers;

  // - insert form
  const formStmt = helpers.insert(form, null, 'form') + ' RETURNING *';
  const insertedForm = await db.one(formStmt);

  // - insert form_fields
  const cs = new helpers.ColumnSet(
    [
      'form_id',
      'organization_id',
      {name: 'job_requirement_id', def: null},
      'component',
      'row_index',
      'label',
      {name: 'intent', def: null},
      {name: 'placeholder', def: null},
      {name: 'description', def: null},
      {name: 'default_value', def: null},
      {name: 'required', def: null},
      {name: 'options', mod: ':json', cast: 'jsonb', def: null},
      {name: 'props', mod: ':json', cast: 'jsonb', def: null},
      {name: 'editable', def: false},
      {name: 'deletable', def: false},
    ],
    {table: 'form_field'},
  );

  const values = form_fields.map((item) => ({
    ...item,
    organization_id: form.organization_id,
    form_id: insertedForm.form_id,
  }));

  const stmt = helpers.insert(values, cs) + ' RETURNING *';

  return db.any(stmt).then((items) => ({...insertedForm, form_fields: items}));
};

export const dbSelectForms = (organization_id: string, job_id?: string) => {
  return db.any(selectFormsSQL, {organization_id, job_id});
};

export const dbSelectForm = (form_id: string) => {
  return db.any(selectFormSQL, {form_id});
};

export const dbDeleteForm = (form_id: string) => {
  const stmt = 'DELETE FROM form WHERE form_id=$1';
  return db.none(stmt, form_id);
};

export const dbUpdateForm = async (
  form_id: string,
  {form_fields, ...form}: TForm,
) => {
  const helpers = db.$config.pgp.helpers;
  const condition =
    ' WHERE form_id=${form_id} AND organization_id=${organization_id}';

  await db.tx(async (t) => {
    if (form.form_title) {
      await t.none('UPDATE form SET form_title=${form_title}' + condition, {
        form_id,
        form_title: form.form_title,
        organization_id: form.organization_id,
      });
    }

    if (form_fields) {
      await t.none('DELETE FROM form_field WHERE form_id=$1', form_id);

      const rawText = (text: string) => ({
        toPostgres: () => text,
        rawType: true,
      });

      const cs = new helpers.ColumnSet(
        [
          {
            name: 'form_field_id',
            def: () => rawText('uuid_generate_v4()'),
          }, // insert form_field_id to make shure already existsing form items "only get updated"
          'form_id',
          'organization_id',
          {name: 'job_requirement_id', def: null},
          'component',
          'row_index',
          'label',
          {name: 'intent', def: null},
          {name: 'placeholder', def: null},
          {name: 'default_value', def: null},
          {name: 'description', def: null},
          {name: 'required', def: null},
          {name: 'options', mod: ':json', cast: 'jsonb', def: null},
          {name: 'props', mod: ':json', cast: 'jsonb', def: null},
          {name: 'editable', def: false},
          {name: 'deletable', def: false},
        ],
        {table: 'form_field'},
      );

      const values = form_fields.map((item) => ({
        ...item,
        organization_id: form.organization_id,
        form_id,
      }));

      const stmt = helpers.insert(values, cs);
      await t.any(stmt);
    }
  });
  return dbSelectForm(form_id).then((resp) => resp[0]);
};
