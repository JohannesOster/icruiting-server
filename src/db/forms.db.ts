import db from '.';
import {
  selectForms as selectFormsSQL,
  selectForm as selectFormSQL,
} from './sql';

interface insertFormParams {
  organization_id: string;
  job_id: string;
  form_title: string;
  form_category: 'APPLICATION' | 'SCREENING' | 'ASSESSMENT';
  form_items: Array<{
    component: string;
    form_index: number;
    label?: string;
    placeholder?: string;
    default_value?: string;
    validation?: {required: boolean};
    options?: Array<{label: string; value: string}>;
    editable?: boolean;
    deletable?: boolean;
  }>;
}
export const insertForm = async (params: insertFormParams) => {
  const form = {
    organization_id: params.organization_id,
    job_id: params.job_id,
    form_title: params.form_title,
    form_category: params.form_category,
  };
  const formStmt =
    db.$config.pgp.helpers.insert(form, null, 'form') + ' RETURNING *';
  const insertedForm = await db.one(formStmt);

  const cs = new db.$config.pgp.helpers.ColumnSet(
    [
      'form_id',
      'component',
      'form_index',
      'label',
      {name: 'placeholder', def: null},
      {name: 'default_value', def: null},
      {name: 'validation', def: null},
      {name: 'options', def: null},
      {name: 'editable', def: false},
      {name: 'deletable', def: false},
    ],
    {table: 'form_item'},
  );

  const values = params.form_items.map((item) => {
    const map = {
      ...item,
      form_id: insertedForm.form_id,
      options: item.options && JSON.stringify(item.options),
      validation: item.validation && JSON.stringify(item.validation),
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
