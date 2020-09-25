import {IDatabase, IMain} from 'pg-promise';
import sql from './sql';
import {decamelizeKeys} from 'humps';

enum EFormCategory {
  application = 'application',
  screening = 'screening',
  assessment = 'assessment',
}

export const FormsRepository = (db: IDatabase<any>, pgp: IMain) => {
  const findAll = (tenantId: string, jobId: string) => {
    return db.any(sql.all, {tenant_id: tenantId, job_id: jobId});
  };

  const find = (formId: string) => {
    return db.oneOrNone(sql.find, {form_id: formId});
  };

  const insert = async (params: {
    tenantId: string;
    formCategory: EFormCategory;
    formTitle?: string;
    jobId: string;
    formFields: {
      rowIndex: number;
      component: string;
      label: string;
      placeholder?: string;
      defaultValue?: string;
      required?: boolean;
      options?: Array<{label: string; value: string}>;
      editable?: boolean;
      deletable?: boolean;
      jobRequirementId?: string;
    }[];
  }) => {
    const {formFields, ...form} = params;

    const helpers = db.$config.pgp.helpers;

    // - insert form
    const formStmt =
      helpers.insert(decamelizeKeys(form), null, 'form') + ' RETURNING *';
    const insertedForm = await db.one(formStmt);

    // - insert formFields
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

    const values = formFields.map((item) => ({
      ...item,
      tenantId: form.tenantId,
      formId: insertedForm.formId,
    }));

    const stmt =
      helpers.insert(
        values.map((val) => decamelizeKeys(val)),
        cs,
      ) + ' RETURNING *';

    return db.any(stmt).then((items) => ({...insertedForm, formFields: items}));
  };

  return {findAll, find, insert};
};
