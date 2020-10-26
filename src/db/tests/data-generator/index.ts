import fs from 'fs';
import {flatten, generateInsert} from './utils';
import {
  tenant,
  job,
  jobRequirements,
  screeningForm,
  applicationForm,
  screeningFormFields,
  applicantAttributes,
  applicants,
  applicationFormFields,
} from './data';

const seedFile = fs.createWriteStream('data.sql');
seedFile.write(generateInsert('tenant', tenant));
seedFile.write(generateInsert('job', job));
seedFile.write(generateInsert('job_requirement', jobRequirements));
seedFile.write(generateInsert('form', [screeningForm, applicationForm]));
seedFile.write(generateInsert('form_field', screeningFormFields));
seedFile.write(generateInsert('form_field', applicationFormFields));
seedFile.write(generateInsert('applicant', applicants));
seedFile.write(generateInsert('applicant_attribute', applicantAttributes));
