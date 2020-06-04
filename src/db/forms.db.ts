import db from '.';
import {selectForms as selectFormsSQL} from './sql';

interface insertFormParams {
  organization_id: string;
  job_id: string;
  form_title: string;
  form_category: 'APPLICATION' | 'SCREENING' | 'ASSESSMENT';
  form_items: Array<{
    component: string;
    item_label: string;
    form_index: number;
    item_validation?: {
      required: boolean;
    };
    item_options?: Array<{label: string; value: string}>;
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
      'item_label',
      'form_index',
      'item_validation',
      'item_options',
      'editable',
      'deletable',
    ],
    {table: 'form_item'},
  );

  const values = params.form_items.map((item) => {
    const map = {
      form_id: insertedForm.form_id,
      component: item.component,
      item_label: item.item_label,
      form_index: item.form_index,
      item_validation:
        (item.item_validation && JSON.stringify(item.item_validation)) || null,
      item_options:
        (item.item_options && JSON.stringify(item.item_options)) || null,
      editable: !!item.editable,
      deletable: !!item.deletable,
    };
    return map;
  });

  const stmt = db.$config.pgp.helpers.insert(values, cs) + ' RETURNING *';

  return db.any(stmt).then((items) => ({...insertedForm, form_items: items}));
};

export const selectForms = (organization_id: string) => {
  return db.any(selectFormsSQL, {organization_id});
};
