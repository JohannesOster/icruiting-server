import db from 'db';
import {
  selectForms as selectFormsSQL,
  selectForm as selectFormSQL,
} from './sql';
import {TFormRequest, TForm} from './types';

export const dbInsertForm = async ({form_fields, ...form}: TFormRequest) => {
  const helpers = db.$config.pgp.helpers;

  // - insert form
  const formStmt = helpers.insert(form, null, 'form') + ' RETURNING *';
  const insertedForm = await db.one(formStmt);

  // - insert form_fields
  const cs = new helpers.ColumnSet(
    [
      'form_id',
      'tenant_id',
      {name: 'job_requirement_id', def: null},
      'component',
      'row_index',
      'label',
      {name: 'intent', def: null},
      {name: 'placeholder', def: null},
      {name: 'description', def: null},
      {name: 'default_value', def: null},
      {name: 'required', def: null, cast: 'boolean'},
      {name: 'options', mod: ':json', cast: 'jsonb', def: null},
      {name: 'props', mod: ':json', cast: 'jsonb', def: null},
      {name: 'editable', def: false},
      {name: 'deletable', def: false},
    ],
    {table: 'form_field'},
  );

  const values = form_fields.map((item) => ({
    ...item,
    tenant_id: form.tenant_id,
    form_id: insertedForm.form_id,
  }));

  const stmt = helpers.insert(values, cs) + ' RETURNING *';

  return db.any(stmt).then((items) => ({...insertedForm, form_fields: items}));
};

export const dbSelectForms = (tenant_id: string, job_id?: string) => {
  return db.any(selectFormsSQL, {tenant_id, job_id});
};

export const dbSelectForm = (form_id: string) => {
  return db.any(selectFormSQL, {form_id}).then((resp) => resp[0]);
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
  const condition = ' WHERE form_id=${form_id} AND tenant_id=${tenant_id}';
  const orgignialForm: TForm = await dbSelectForm(form_id).then((resp) => {
    return resp[0];
  });

  await db.tx(async (t) => {
    // await t.none('SET CONSTRAINTS form_id_row_index_unique DEFERRED');
    await t.none('SET CONSTRAINTS ALL DEFERRED');
    if (form.form_title) {
      await t.none('UPDATE form SET form_title=${form_title}' + condition, {
        form_id,
        form_title: form.form_title,
        tenant_id: form.tenant_id,
      });
    }

    if (form_fields) {
      /** DELETE ======================== */
      // array of defined form_field_ids (= all fields wich are actually updated and not added)
      const fieldsWithId = form_fields
        .map(({form_field_id}) => form_field_id)
        .filter((id) => id);

      // all fields of the orginial form where no field is provided in request => they were deleted
      const toDelete = orgignialForm.form_fields.filter(
        ({form_field_id}) => !fieldsWithId.includes(form_field_id),
      );

      // delete old fields
      await toDelete.forEach(async ({form_field_id}) => {
        await t.none(
          'DELETE FROM form_field WHERE form_field_id=$1',
          form_field_id,
        );
      });

      /** INSERT ========================= */
      // all fields where there is not form_item_id => they were added
      const toInsert = form_fields.filter(({form_field_id}) => !form_field_id);
      if (toInsert.length) {
        const cs = new helpers.ColumnSet(
          [
            {name: 'form_id', cast: 'uuid'},
            {name: 'tenant_id', cast: 'uuid'},
            {name: 'job_requirement_id', def: null, cast: 'uuid'},
            {name: 'component', cast: 'form_field_component'},
            'row_index',
            'label',
            {name: 'intent', def: null, cast: 'form_field_intent'},
            {name: 'placeholder', def: null},
            {name: 'default_value', def: null},
            {name: 'description', def: null},
            {name: 'required', def: null, cast: 'boolean'},
            {name: 'options', mod: ':json', cast: 'jsonb', def: null},
            {name: 'props', mod: ':json', cast: 'jsonb', def: null},
            {name: 'editable', def: false},
            {name: 'deletable', def: false},
          ],
          {table: 'form_field'},
        );

        const values = toInsert.map((item) => ({
          ...item,
          tenant_id: form.tenant_id,
          form_id,
        }));

        const stmt = helpers.insert(values, cs);
        await t.any(stmt);
      }

      /** UPDATE ========================== */
      // all fields where there is a form_field_id but they havent been deleted
      const toUpdate = form_fields.filter(({form_field_id}) => !!form_field_id);
      if (toUpdate.length) {
        const csUpdate = new helpers.ColumnSet(
          [
            '?form_field_id',
            {name: 'job_requirement_id', def: null, cast: 'uuid'},
            {name: 'component', cast: 'form_field_component'},
            'row_index',
            'label',
            {name: 'intent', def: null, cast: 'form_field_intent'},
            {name: 'placeholder', def: null},
            {name: 'default_value', def: null},
            {name: 'description', def: null},
            {name: 'required', def: null, cast: 'boolean'},
            {name: 'options', mod: ':json', cast: 'jsonb', def: null},
            {name: 'props', mod: ':json', cast: 'jsonb', def: null},
            {name: 'editable', def: false},
            {name: 'deletable', def: false},
          ],
          {table: 'form_field'},
        );

        const updateStmt =
          helpers.update(toUpdate, csUpdate) +
          ' WHERE v.form_field_id::uuid = t.form_field_id::uuid';
        await t.any(updateStmt);
      }
    }
  });

  return dbSelectForm(form_id).then((resp) => resp[0]);
};
