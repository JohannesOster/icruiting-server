import {v4} from 'uuid';

export type Id = string;
export const createId = (id: string = v4()) => id;
