import {body} from 'express-validator';

export const validateCreateForm = [
  body('form_title').isString(),
  body('job_id').isUUID(),
  body('form_category').isIn(['application', 'screening', 'assessment']),
  body('form_items').isArray({min: 1}),
  body('form_items[*].component').isIn([
    'input',
    'textarea',
    'select',
    'radio',
    'file_upload',
    'rating_group',
  ]),
  body('form_items[*].label').isString(),
  body('form_items[*].placeholder').optional().isString(),
  body('form_items[*].default_value').optional(),
  body('form_items[*].row_index').isInt(),
  body('form_items[*].validation.required').optional().isBoolean(),
  body('form_items[*].options[*].label').optional().isString(),
  body('form_items[*].options[*].value').optional(),
  body('form_items[*].editable').optional().isBoolean(),
  body('form_items[*].deletable').optional().isBoolean(),
];
