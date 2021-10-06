import {isNil, omitBy} from 'lodash';
import {createId} from '.';
import {Id} from './id';

export interface Entity {
  id: Id;
}

export interface EntityFactory<T, E> {
  (props: T, id?: Id): E;
}

export const createEntity = <E>(
  props: any,
  id?: string | undefined,
): E & Entity => {
  if (!id) id = createId();
  const omitNullAndUndefined = (omitBy(props, isNil) as unknown) as any;
  return Object.freeze({...omitNullAndUndefined, id});
};
