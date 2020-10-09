import {body} from 'express-validator';

export const postJobsRules = [
  body('jobTitle').isString(),
  body('jobRequirements').isArray(),
  body('jobRequirements[*].requirementLabel').isString(),
  body('jobRequirements[*].minValue').optional().isNumeric(),
];

export const putJobRules = [
  body('jobTitle').isString(),
  body('jobRequirements').isArray(),
  body('jobRequirements[*].requirementLabel').isString(),
  body('jobRequirements[*].minValue').optional({nullable: true}).isNumeric(),
];

export const postApplicantReportRules = [
  body('image').optional().isUUID(),
  body('attributes').exists().isArray(),
  body('attributes[*]').isUUID(),
];
