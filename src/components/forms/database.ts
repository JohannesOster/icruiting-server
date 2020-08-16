import db from 'db';
import {
  selectForms as selectFormsSQL,
  selectForm as selectFormSQL,
} from './sql';
import {TForm} from './types';

export const dbInsertForm = async ({form_items, ...form}: TForm) => {
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

export const dbSelectForms = (organization_id: string) => {
  return db.any(selectFormsSQL, {organization_id});
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
  return dbSelectForm(form_id).then((resp) => resp[0]);
};
