import {body} from 'express-validator';

const formRules = [
  body('jobId').isUUID(),
  body('formCategory').isIn(['application', 'screening', 'assessment']),
  body('formTitle').optional({nullable: true}).isString(),
  body('formFields').isArray({min: 1}),
  body('formFields[*].component').isIn([
    'section_header',
    'input',
    'textarea',
    'select',
    'radio',
    'file_upload',
    'rating_group',
    'checkbox',
  ]),
  body('formFields[*].label').isString(),
  body('formFields[*].placeholder').optional({nullable: true}).isString(),
  body('formFields[*].defaultValue').optional({nullable: true}),
  body('formFields[*].rowIndex').isInt(),
  body('formFields[*].required').optional({nullable: true}).isBoolean(),
  body('formFields[*].options[*].label').optional({nullable: true}).isString(),
  body('formFields[*].options[*].value').optional({nullable: true}),
  body('formFields[*].editable').optional({nullable: true}).isBoolean(),
  body('formFields[*].deletable').optional({nullable: true}).isBoolean(),
];

export const createRules = formRules;
export const updateRules = [...formRules, body('formId')];
