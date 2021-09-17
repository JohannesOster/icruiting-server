import {body} from 'express-validator';

const jobRules = [
  body('jobTitle').isString(),
  body('jobRequirements').isArray(),
  body('jobRequirements[*].requirementLabel').isString(),
  body('jobRequirements[*].minValue')
    .optional({nullable: true})
    .isNumeric()
    .toFloat(),
];

export const createRules = jobRules;
export const updateRules = jobRules;

export const reportRules = [body().isArray({min: 1})];
