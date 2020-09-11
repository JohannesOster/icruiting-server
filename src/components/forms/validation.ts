import {body} from 'express-validator';

export const createFormValidationRules = [
  body('job_id').isUUID(),
  body('form_category').isIn(['application', 'screening', 'assessment']),
  body('form_title').optional().isString(),
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
  body('form_fields[*].placeholder').optional().isString(),
  body('form_fields[*].default_value').optional(),
  body('form_fields[*].row_index').isInt(),
  body('form_fields[*].required').optional().isBoolean(),
  body('form_fields[*].options[*].label').optional().isString(),
  body('form_fields[*].options[*].value').optional(),
  body('form_fields[*].editable').optional().isBoolean(),
  body('form_fields[*].deletable').optional().isBoolean(),
];
