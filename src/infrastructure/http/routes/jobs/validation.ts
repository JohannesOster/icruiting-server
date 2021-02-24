import {body} from 'express-validator';

export const createRules = [
  body('jobTitle').isString(),
  body('jobRequirements').isArray(),
  body('jobRequirements[*].requirementLabel').isString(),
  body('jobRequirements[*].minValue')
    .optional({nullable: true})
    .isNumeric()
    .toFloat(),
];

export const updateRules = [
  body('jobTitle').isString(),
  body('jobRequirements').isArray(),
  body('jobRequirements[*].requirementLabel').isString(),
  body('jobRequirements[*].minValue')
    .optional({nullable: true})
    .isNumeric()
    .toFloat(),
];

export const reportRules = [body().isArray({min: 1})];
