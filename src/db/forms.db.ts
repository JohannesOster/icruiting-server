import db from '.';
import {
  selectForms as selectFormsSQL,
  selectForm as selectFormSQL,
} from './sql';

interface insertFormParams {
  form_id?: string;
  organization_id: string;
  job_id: string;
  form_category: 'application' | 'screening' | 'assessment';
  form_items: Array<{
    component: string;
    row_index: number;
    label?: string;
    placeholder?: string;
    default_value?: string | number;
    validation?: {required: boolean};
    options?: Array<{label: string; value: string | number}>;
    editable?: boolean;
    deletable?: boolean;
  }>;
}
export const insertForm = async (params: insertFormParams) => {
  const form: any = {
    organization_id: params.organization_id,
    job_id: params.job_id,
    form_category: params.form_category,
  };
  if (params.form_id) form.form_id = params.form_id;
  const formStmt =
    db.$config.pgp.helpers.insert(form, null, 'form') + ' RETURNING *';
  const insertedForm = await db.one(formStmt);

  const cs = new db.$config.pgp.helpers.ColumnSet(
    [
      'form_id',
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

  const values = params.form_items.map((item) => {
    const map = {
      ...item,
      form_id: insertedForm.form_id,
    };

    return map;
  });

  const stmt = db.$config.pgp.helpers.insert(values, cs) + ' RETURNING *';

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

export const updateForm = (form_id: string, body: any) => {
  return db
    .tx(async (t) => {
      const promises = [];
      promises.push(db.one('SELECT * FROM form WHERE form_id = $1', [form_id]));
      if (body.form_items) {
        /*
         * Instead of updating existing items all items are deleted and new items are inserted
         * This is because it is pretty complicated to row_index, since it is unique
         */
        await db.none('DELETE FROM form_item WHERE form_id=$1', form_id);
        const cs = new db.$config.pgp.helpers.ColumnSet(
          [
            'form_id',
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

        const values = body.form_items.map((item: any) => {
          const map = {...item, form_id};
          return map;
        });

        const stmt = db.$config.pgp.helpers.insert(values, cs) + ' RETURNING *';
        promises.push(db.any(stmt));
      } else {
        const stmt = 'SELECT * FROM form_item WHERE form_id=$1';
        promises.push(db.any(stmt, form_id));
      }

      return t.batch(promises);
    })
    .then((result) => {
      const form = result[0];
      const formItems = result[1];
      return {
        ...form,
        form_items: formItems,
      };
    });
};
