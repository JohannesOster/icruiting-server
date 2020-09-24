import pgPromise from 'pg-promise';
import {IInitOptions} from 'pg-promise';
import {IExtensions, TenantsRepository, JobssRepository} from './repos';
import config from './config';

const initOptions: IInitOptions<IExtensions> = {
  extend(obj) {
    obj.tenants = TenantsRepository(obj, pgp);
    obj.jobs = JobssRepository(obj, pgp);
  },
};

const pgp = pgPromise(initOptions);
const db = pgp(config.url);

export {db as default, pgp};
