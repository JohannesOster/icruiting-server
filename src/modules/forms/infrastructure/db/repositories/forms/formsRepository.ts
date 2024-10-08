import sql from './sql';
import {decamelizeKeys} from 'humps';
import {DBAccess} from 'shared/infrastructure/http';
import {compareArrays} from 'infrastructure/db/utils';
import {Form} from 'modules/forms/domain';
import {Form as DBForm} from './types';
import {formsMapper} from 'modules/forms/mappers';

export * from './types';

export const FormsRepository = ({db, pgp}: DBAccess) => {
  const list = (
    tenantId: string,
    query: {jobId?: string; formCategory?: string},
  ): Promise<Form[]> => {
    const params = {tenantId, ...query} as any;
    if (!params.jobId) params.jobId = null;
    if (!params.formCategory) params.formCategory = null;

    return db
      .any(sql.list, decamelizeKeys(params))
      .then((forms) => forms.map(formsMapper.toDomain));
  };

  const retrieve = (tenantId: string | null, formId: string): Promise<Form | null> => {
    return db
      .oneOrNone(sql.retrieve, {tenant_id: tenantId, form_id: formId})
      .then((form) => (form ? formsMapper.toDomain(form) : null));
  };

  const create = async (params: ReturnType<typeof formsMapper.toPersistance>): Promise<Form> => {
    const {formFields, ...form} = params;

    const helpers = db.$config.pgp.helpers;

    // - insert form
    const formStmt = helpers.insert(decamelizeKeys(form), null, 'form') + ' RETURNING *';
    const insertedForm = await db.one(formStmt);

    if (!formFields.length) {
      return Promise.resolve({...insertedForm, formFields: []}).then(formsMapper.toDomain);
    }

    // - insert formFields
    const cs = new helpers.ColumnSet(
      [
        'form_id',
        {name: 'job_requirement_id', def: null},
        'component',
        'row_index',
        'label',
        {name: 'visibility', def: 'all'},
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
      formId: insertedForm.formId,
    }));

    const stmt =
      helpers.insert(
        values.map((val) => decamelizeKeys(val)),
        cs,
      ) + ' RETURNING *';

    return db
      .any(stmt)
      .then((formFields) => ({
        ...insertedForm,
        formFields,
      }))
      .then(formsMapper.toDomain);
  };

  const update = async (params: DBForm): Promise<Form> => {
    const orgignialForm = await retrieve(params.tenantId, params.formId);
    if (!orgignialForm) throw new Error('Did not find form to update');
    const {update, insert, ColumnSet} = pgp.helpers;

    await db.tx(async (t) => {
      await t.none('SET CONSTRAINTS ALL DEFERRED');
      const promises: Promise<any>[] = [];
      if (params.formTitle !== orgignialForm.formTitle) {
        const columns = ['?tenant_id', '?form_id', 'form_title'];
        const cs = new ColumnSet(columns, {table: 'form'});
        const values = {
          tenant_id: params.tenantId,
          form_id: params.formId,
          form_title: params.formTitle,
        };
        const stmt = update(values, cs) + ' WHERE form_id=${form_id} AND tenant_id=${tenant_id}';
        const promise = t.none(stmt, {
          tenant_id: params.tenantId,
          form_id: params.formId,
        });

        promises.push(promise);
      }

      const fieldsMap = compareArrays(
        params.formFields,
        formsMapper.toPersistance(orgignialForm).formFields,
        (a, b) => a.formFieldId === b.formFieldId,
      );

      /** DELETE ======================== */
      promises.concat(
        fieldsMap.secondMinusFirst.map(async ({formFieldId}) => {
          return t.none('DELETE FROM form_field WHERE form_field_id=$1', formFieldId);
        }),
      );

      /** INSERT ========================= */
      if (fieldsMap.firstMinusSecond.length) {
        const cs = new ColumnSet(
          [
            {name: 'form_id', cast: 'uuid'},
            {name: 'job_requirement_id', def: null, cast: 'uuid'},
            'component',
            'row_index',
            'label',
            {name: 'visibility', def: 'all'},
            {name: 'intent', def: null},
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

        const fields = fieldsMap.firstMinusSecond.map((item) => ({
          ...item,
          formId: params.formId,
        }));

        const values = decamelizeKeys(fields);
        const stmt = insert(values, cs);
        promises.push(t.any(stmt));
      }

      /** UPDATE ========================== */
      if (fieldsMap.intersection.length) {
        const csUpdate = new ColumnSet(
          [
            '?form_field_id',
            {name: 'job_requirement_id', def: null, cast: 'uuid'},
            'component',
            'row_index',
            'label',
            {name: 'visibility', def: 'all'},
            {name: 'intent', def: null},
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

        const values = decamelizeKeys(fieldsMap.intersection);
        const updateStmt =
          update(values, csUpdate) + ' WHERE v.form_field_id::uuid = t.form_field_id';
        promises.push(t.any(updateStmt));
      }
      return t.batch(promises);
    });

    return retrieve(params.tenantId, params.formId).then((form) => {
      if (!form) throw new Error('Did not find form after update');
      return form;
    });
  };

  const del = (tenantId: string, formId: string): Promise<null> => {
    const stmt = 'DELETE FROM form WHERE form_id=${form_id} AND tenant_id=${tenant_id}';
    return db.none(stmt, {tenant_id: tenantId, form_id: formId});
  };

  return {create, retrieve, update, del, list};
};
