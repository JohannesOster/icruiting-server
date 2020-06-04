import {body} from 'express-validator';

export const validateCreateForm = [
  body('form_title').isString(),
  body('job_id').isUUID(),
  body('form_category').isString(),
  body('form_items').isArray({min: 1}),
  body('form_items[*].component').isString(),
  body('form_items[*].item_label').isString(),
  body('form_items[*].item_name').isString(),
  body('form_items[*].form_index').isInt(),
  body('form_items[*].item_validation.required').optional().isBoolean(),
  body('form_items[*].item_options.label').optional().isString(),
  body('form_items[*].item_options.value').optional().isString(),
  body('form_items[*].editable').optional().isBoolean(),
  body('form_items[*].deletable').optional().isBoolean(),
];
