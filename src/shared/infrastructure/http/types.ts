import {Router} from 'express';
import {IDatabase, IMain} from 'pg-promise';

export interface DBAccess {
  db: IDatabase<any>;
  pgp: IMain;
}

export interface RouterFactory {
  (dbAccess: DBAccess): Router;
}
