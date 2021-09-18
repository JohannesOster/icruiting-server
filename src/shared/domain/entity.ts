import {isNil, omitBy} from 'lodash';
import {createId} from '.';
import {Id} from './id';

export interface Entity {
  id: Id;
}

export interface EntityFactory<T, E> {
  (props: T, id?: Id): E;
}

export const createEntity = <E>(props: any, id = createId()): E => {
  const omitNullAndUndefined = omitBy(props, isNil) as unknown as any;
  return Object.freeze({...omitNullAndUndefined, id});
};
