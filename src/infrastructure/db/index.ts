import pgPromise from 'pg-promise';
import {IInitOptions, IDatabase, IMain} from 'pg-promise';
import {
  IExtensions,
  TenantsRepository,
  JobsRepository,
  ApplicantsRepository,
  FormSubmissionsRepository,
  RankingsRepository,
} from './repos';
import config from './config';
import humps from 'humps';

export interface DBAccess {
  db: IDatabase<any>;
  pgp: IMain;
}

const initOptions: IInitOptions<IExtensions> = {
  extend(obj) {
    obj.tenants = TenantsRepository(obj, pgp);
    obj.jobs = JobsRepository(obj, pgp);
    obj.applicants = ApplicantsRepository(obj, pgp);
    obj.formSubmissions = FormSubmissionsRepository(obj, pgp);
    obj.rankings = RankingsRepository(obj, pgp);
  },
  receive(data, result) {
    if (!result) return result;
    result.rows = data.map((obj) => humps.camelizeKeys(obj));
  },
};

const pgp = pgPromise(initOptions);
const db = pgp(config.url);

export {db as default, pgp};
