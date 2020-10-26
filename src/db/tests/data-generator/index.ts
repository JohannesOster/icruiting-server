import fs from 'fs';
import {generateInsert} from './utils';
import {
  tenant,
  job,
  jobRequirements,
  screeningForm,
  screeningFormFields,
} from './data';

const seedFile = fs.createWriteStream('data.sql');
seedFile.write(generateInsert('tenant', tenant));
seedFile.write(generateInsert('job', job));
seedFile.write(generateInsert('job_requirement', jobRequirements));
seedFile.write(generateInsert('form', screeningForm));
seedFile.write(generateInsert('form_field', screeningFormFields));
