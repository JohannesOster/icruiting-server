import {body} from 'express-validator';

const formRules = [
  body('job_id').isUUID(),
  body('form_category').isIn(['application', 'screening', 'assessment']),
  body('form_title').optional({nullable: true}).isString(),
  body('form_fields').isArray({min: 1}),
  body('form_fields[*].component').isIn([
    'input',
    'textarea',
    'select',
    'radio',
    'file_upload',
    'rating_group',
    'checkbox',
    'date_picker',
  ]),
  body('form_fields[*].label').isString(),
  body('form_fields[*].placeholder').optional({nullable: true}).isString(),
  body('form_fields[*].default_value').optional({nullable: true}),
  body('form_fields[*].row_index').isInt(),
  body('form_fields[*].required').optional({nullable: true}).isBoolean(),
  body('form_fields[*].options[*].label').optional({nullable: true}).isString(),
  body('form_fields[*].options[*].value').optional({nullable: true}),
  body('form_fields[*].editable').optional({nullable: true}).isBoolean(),
  body('form_fields[*].deletable').optional({nullable: true}).isBoolean(),
];

export const createFormValidationRules = formRules;
export const updateFormValidationRules = [...formRules, body('form_id')];
