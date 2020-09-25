import db from 'db';
import {TForm} from './types';

export const dbDeleteForm = (formId: string) => {
  const stmt = 'DELETE FROM form WHERE formId=$1';
  return db.none(stmt, formId);
};

export const dbUpdateForm = async (
  formId: string,
  {formFields, ...form}: TForm,
) => {
  const helpers = db.$config.pgp.helpers;
  const condition = ' WHERE formId=${formId} AND tenantId=${tenantId}';
  const orgignialForm: TForm = await db.forms.find(form.tenantId, formId);

  await db.tx(async (t) => {
    // await t.none('SET CONSTRAINTS formId_rowIndex_unique DEFERRED');
    await t.none('SET CONSTRAINTS ALL DEFERRED');
    if (form.formTitle) {
      await t.none('UPDATE form SET formTitle=${formTitle}' + condition, {
        formId,
        formTitle: form.formTitle,
        tenantId: form.tenantId,
      });
    }

    if (formFields) {
      /** DELETE ======================== */
      // array of defined formFieldIds (= all fields wich are actually updated and not added)
      const fieldsWithId = formFields
        .map(({formFieldId}) => formFieldId)
        .filter((id) => id);

      // all fields of the orginial form where no field is provided in request => they were deleted
      const toDelete = orgignialForm.formFields.filter(
        ({formFieldId}) => !fieldsWithId.includes(formFieldId),
      );

      // delete old fields
      await toDelete.forEach(async ({formFieldId}) => {
        await t.none(
          'DELETE FROM form_field WHERE formFieldId=$1',
          formFieldId,
        );
      });

      /** INSERT ========================= */
      // all fields where there is not formItemId => they were added
      const toInsert = formFields.filter(({formFieldId}) => !formFieldId);
      if (toInsert.length) {
        const cs = new helpers.ColumnSet(
          [
            {name: 'formId', cast: 'uuid'},
            {name: 'tenantId', cast: 'uuid'},
            {name: 'jobRequirementId', def: null, cast: 'uuid'},
            {name: 'component', cast: 'form_field_component'},
            'rowIndex',
            'label',
            {name: 'intent', def: null, cast: 'form_field_intent'},
            {name: 'placeholder', def: null},
            {name: 'defaultValue', def: null},
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
          tenantId: form.tenantId,
          formId,
        }));

        const stmt = helpers.insert(values, cs);
        await t.any(stmt);
      }

      /** UPDATE ========================== */
      // all fields where there is a formFieldId but they havent been deleted
      const toUpdate = formFields.filter(({formFieldId}) => !!formFieldId);
      if (toUpdate.length) {
        const csUpdate = new helpers.ColumnSet(
          [
            '?formFieldId',
            {name: 'jobRequirementId', def: null, cast: 'uuid'},
            {name: 'component', cast: 'form_field_component'},
            'rowIndex',
            'label',
            {name: 'intent', def: null, cast: 'form_field_intent'},
            {name: 'placeholder', def: null},
            {name: 'defaultValue', def: null},
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
          ' WHERE v.formFieldId::uuid = t.formFieldId::uuid';
        await t.any(updateStmt);
      }
    }
  });

  return db.forms.find(form.tenantId, formId);
};
