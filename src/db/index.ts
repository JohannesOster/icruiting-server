import pgPromise from 'pg-promise';
import {IInitOptions} from 'pg-promise';
import {
  IExtensions,
  TenantsRepository,
  JobssRepository,
  ApplicantsRepository,
  FormsRepository,
  FormSubmissionsRepository,
} from './repos';
import config from './config';
import humps from 'humps';

const initOptions: IInitOptions<IExtensions> = {
  extend(obj) {
    obj.tenants = TenantsRepository(obj, pgp);
    obj.jobs = JobssRepository(obj, pgp);
    obj.applicants = ApplicantsRepository(obj, pgp);
    obj.forms = FormsRepository(obj, pgp);
    obj.formSubmissions = FormSubmissionsRepository(obj, pgp);
  },
  receive(data, result) {
    result.rows = data.map((obj) => humps.camelizeKeys(obj));
  },
};

const pgp = pgPromise(initOptions);
const db = pgp(config.url);

export {db as default, pgp};
