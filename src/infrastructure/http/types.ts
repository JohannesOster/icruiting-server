import {Router} from 'express';
import {DBAccess} from 'infrastructure/db';

export interface RouterFactory {
  (dbAccess: DBAccess): Router;
}
